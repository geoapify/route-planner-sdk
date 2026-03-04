import { RouteResultEditorBase } from "../../../route-result-editor-base";

const LOCATION_EPSILON = 1e-6;

/**
 * Calculates optimal insertion points for new locations in existing routes.
 * Uses existing leg data only.
 */
export class InsertionCostCalculator {

    static async findOptimalInsertionPoint(context: RouteResultEditorBase, agentIndex: number,
                                           route: [number, number][], newLocation: [number, number],
                                           options?: {
                                               canInsertBeforeFirst?: boolean;
                                               canInsertAfterLast?: boolean;
                                           }): Promise<number> {
        if (route.length === 0) {
            return 0;
        }
        
        const insertionPositions = this.getInsertionPositions(route.length, options?.canInsertBeforeFirst || false, options?.canInsertAfterLast || false);

        if (insertionPositions.length === 1) {
            return insertionPositions[0];
        }

        const matrixHelper = context.getMatrixHelper();
        const [timesToNew, timesFromNew] = await Promise.all([
            matrixHelper.calculateTimesToLocation(route, newLocation),
            matrixHelper.calculateTimesFromLocation(newLocation, route)
        ]);

        const consecutiveTimes = this.getConsecutiveTimes(context, agentIndex, route);

        let bestPosition = insertionPositions[0];
        let minCost = Number.POSITIVE_INFINITY;

        for (const position of insertionPositions) {
            const cost = this.calculateInsertionCost(position, route, timesToNew, timesFromNew, consecutiveTimes);
            if (cost < minCost) {
                minCost = cost;
                bestPosition = position;
            }
        }

        return bestPosition;
    }

    protected static getConsecutiveTimes(context: RouteResultEditorBase, agentIndex: number,
                                       routeLocations: [number, number][]): number[] {
        if (routeLocations.length < 2) {
            return [];
        }

        const existingTimes = this.getExistingConsecutiveTimes(context, agentIndex, routeLocations);
        if (existingTimes) {
            return existingTimes;
        }

        throw new Error(
            `Missing consecutive leg times for agent ${agentIndex}. Ensure legs are recalculated when legs are modified.`
        );
    }

    protected static getExistingConsecutiveTimes(
        context: RouteResultEditorBase,
        agentIndex: number,
        routeLocations: [number, number][]
    ): number[] | null {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints || [];
        const legs = agentFeature.properties.legs || [];

        if (routeLocations.length < 2 || waypoints.length < 2 || legs.length === 0) {
            return null;
        }

        const waypointLocations = waypoints.map((waypoint) => waypoint.location || waypoint.original_location);
        const startIndex = this.findSubRouteStartIndex(waypointLocations, routeLocations);
        if (startIndex === -1) {
            return null;
        }

        const result: number[] = [];
        for (let i = 0; i < routeLocations.length - 1; i++) {
            const fromWaypointIndex = startIndex + i;
            const toWaypointIndex = fromWaypointIndex + 1;
            const leg = legs.find((candidate) =>
                candidate.from_waypoint_index === fromWaypointIndex &&
                candidate.to_waypoint_index === toWaypointIndex
            );

            if (!leg || leg.time === undefined || leg.time < 0) {
                return null;
            }

            result.push(leg.time);
        }

        return result;
    }

    private static findSubRouteStartIndex(
        waypointLocations: [number, number][],
        routeLocations: [number, number][]
    ): number {
        const maxStart = waypointLocations.length - routeLocations.length;

        for (let start = 0; start <= maxStart; start++) {
            let matches = true;

            for (let offset = 0; offset < routeLocations.length; offset++) {
                if (!this.sameLocation(waypointLocations[start + offset], routeLocations[offset])) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                return start;
            }
        }

        return -1;
    }

    private static sameLocation(a: [number, number], b: [number, number]): boolean {
        return Math.abs(a[0] - b[0]) <= LOCATION_EPSILON &&
               Math.abs(a[1] - b[1]) <= LOCATION_EPSILON;
    }

    private static calculateInsertionCost(
        insertionPosition: number,
        route: [number, number][],
        timesToNew: number[],
        timesFromNew: number[],
        consecutiveTimes: number[]
    ): number {
        if (insertionPosition <= 0) {
            return timesFromNew[0];
        }

        if (insertionPosition >= route.length) {
            return timesToNew[route.length - 1];
        }

        const fromIndex = insertionPosition - 1;
        return timesToNew[fromIndex] + timesFromNew[insertionPosition] - consecutiveTimes[fromIndex];
    }

    private static getInsertionPositions(
        routeLength: number,
        canInsertBeforeFirst: boolean,
        canInsertAfterLast: boolean
    ): number[] {
        const startPosition = canInsertBeforeFirst ? 0 : 1;
        const endPosition = canInsertAfterLast ? routeLength : routeLength - 1;
        const result: number[] = [];

        for (let position = startPosition; position <= endPosition; position++) {
            result.push(position);
        }

        return result;
    }
}
