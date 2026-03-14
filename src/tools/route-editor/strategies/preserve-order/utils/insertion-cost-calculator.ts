import { RouteResultEditorBase } from "../../../route-result-editor-base";

const LOCATION_EPSILON = 1e-6;

export type InsertionTravelTimes = {
    locationFrom: [number, number];
    locationTo: [number, number];
    time: number;
}[];

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
                                               travelTimes?: InsertionTravelTimes;
                                           }): Promise<number> {
        if (route.length === 0) {
            return 0;
        }
        
        const insertionPositions = this.getInsertionPositions(route.length, options?.canInsertBeforeFirst || false, options?.canInsertAfterLast || false);

        if (insertionPositions.length === 1) {
            return insertionPositions[0];
        }

        const travelTimeMap = this.buildTravelTimeMap(options?.travelTimes || []);
        const consecutiveTimes = await this.getConsecutiveTimes(context, agentIndex, route, travelTimeMap);

        let bestPosition = insertionPositions[0];
        let minCost = Number.POSITIVE_INFINITY;

        for (const position of insertionPositions) {
            const cost = this.calculateInsertionCost(position, route, newLocation, travelTimeMap, consecutiveTimes);
            if (cost < minCost) {
                minCost = cost;
                bestPosition = position;
            }
        }

        return bestPosition;
    }

    protected static async getConsecutiveTimes(
        context: RouteResultEditorBase,
        agentIndex: number,
        routeLocations: [number, number][],
        travelTimeMap: Map<string, number>
    ): Promise<number[]> {
        if (routeLocations.length < 2) {
            return [];
        }

        const agentFeature = context.getAgentFeature(agentIndex);
        const legs = agentFeature.properties.legs || [];
        const waypointLocations = (agentFeature.properties.waypoints || []).map((waypoint) => waypoint.location || waypoint.original_location);

        const result: number[] = [];
        for (let i = 0; i < routeLocations.length - 1; i++) {
            const fromLocation = routeLocations[i];
            const toLocation = routeLocations[i + 1];

            if (this.sameLocation(fromLocation, toLocation)) {
                result.push(0);
                continue;
            }

            const fromWaypointIndex = waypointLocations.findIndex((waypointLocation) =>
                waypointLocation && this.sameLocation(waypointLocation, fromLocation)
            );

            const toWaypointIndex = waypointLocations.findIndex((waypointLocation) =>
                waypointLocation && this.sameLocation(waypointLocation, toLocation)
            );

            // 1. try to get from existing legs
            if (fromWaypointIndex >= 0 && toWaypointIndex >= 0) {
                const leg = legs.find((candidate) =>
                    candidate.from_waypoint_index === fromWaypointIndex &&
                    candidate.to_waypoint_index === toWaypointIndex
                );

                if (leg) {
                    result.push(leg.time);
                    continue;
                }
            }

            // 2. try to get from matrix
            const key = this.getTravelTimeKey(fromLocation, toLocation);
            const time = travelTimeMap.get(key);
            if (time) {
                result.push(time);
                continue;
            }

            // 3. get from RoutingHelper (single pair)
            const calculatedTimes = await context.getRoutingHelper().calculateConsecutiveTravelTimes([fromLocation, toLocation]);
            const computedTime = calculatedTimes[0];

            if (typeof computedTime !== "number") {
                throw new Error(
                    `Unable to calculate travel time between ${fromLocation[0]},${fromLocation[1]} and ${toLocation[0]},${toLocation[1]}.`
                );
            }

            result.push(computedTime);
        }

        return result;
    }

    private static sameLocation(a: [number, number], b: [number, number]): boolean {
        return Math.abs(a[0] - b[0]) <= LOCATION_EPSILON &&
               Math.abs(a[1] - b[1]) <= LOCATION_EPSILON;
    }

    private static calculateInsertionCost(
        insertionPosition: number,
        route: [number, number][],
        newLocation: [number, number],
        travelTimeMap: Map<string, number>,
        consecutiveTimes: number[]
    ): number {
        if (insertionPosition <= 0) {
            return this.getTravelTime(travelTimeMap, newLocation, route[0]);
        }

        if (insertionPosition >= route.length) {
            return this.getTravelTime(travelTimeMap, route[route.length - 1], newLocation);
        }

        const fromIndex = insertionPosition - 1;
        return this.getTravelTime(travelTimeMap, route[fromIndex], newLocation)
            + this.getTravelTime(travelTimeMap, newLocation, route[insertionPosition])
            - consecutiveTimes[fromIndex];
    }

    private static buildTravelTimeMap(travelTimes: InsertionTravelTimes): Map<string, number> {
        const map = new Map<string, number>();
        for (const travelTime of travelTimes) {
            map.set(this.getTravelTimeKey(travelTime.locationFrom, travelTime.locationTo), travelTime.time);
        }
        return map;
    }

    private static getTravelTime(
        travelTimeMap: Map<string, number>,
        locationFrom: [number, number],
        locationTo: [number, number]
    ): number {
        const key = this.getTravelTimeKey(locationFrom, locationTo);
        const travelTime = travelTimeMap.get(key);
        if (travelTime === undefined) {
            throw new Error(`Missing travel time for pair ${key}.`);
        }
        return travelTime;
    }

    private static getTravelTimeKey(locationFrom: [number, number], locationTo: [number, number]): string {
        return `${locationFrom[0]},${locationFrom[1]}->${locationTo[0]},${locationTo[1]}`;
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
