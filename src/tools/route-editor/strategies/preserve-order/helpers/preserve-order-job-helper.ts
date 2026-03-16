import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import {AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator, InsertionTravelTimes} from "../utils/insertion-cost-calculator";

const LOCATION_EPSILON = 1e-6;

export interface JobInsertPosition {
    position: number;
    createWaypoint: boolean;
}

export class PreserveOrderJobHelper extends PreserveOrderBaseHelper {

    static async determineInsertPosition(
        context: RouteResultEditorBase,
        agentIndex: number,
        firstJobIndex: number,
        options: AddAssignOptions
    ): Promise<JobInsertPosition> {
        const job = RouteEditorHelper.getJobByIndex(context, firstJobIndex);
        const jobLocation = RouteEditorHelper.resolveJobLocation(context, job);
        const waypoints = context.getAgentFeature(agentIndex).properties.waypoints || [];

        // append: true (no position) → Append
        if (InsertPositionResolver.shouldAppend(options)) {
            const position = await this.getEndPosition(context, agentIndex);
            return { position, createWaypoint: true };
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const position = InsertPositionResolver.resolveInsertPosition(options);
            return { position, createWaypoint: true };
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (options.afterWaypointIndex !== undefined && !options.append) {
            const minPosition = options.afterWaypointIndex ?? 0;
            const reusableWaypointIndex = this.findExistingWaypointByLocation(waypoints, jobLocation, minPosition + 1);
            if (reusableWaypointIndex !== -1) {
                return { position: reusableWaypointIndex, createWaypoint: false };
            }

            const position = await this.findOptimalInsertPositionAfter(context, agentIndex, firstJobIndex, minPosition);
            return { position, createWaypoint: true };
        }

        // No position params → Use Route Matrix API to find optimal position anywhere
        const reusableWaypointIndex = this.findExistingWaypointByLocation(waypoints, jobLocation, 0);
        if (reusableWaypointIndex !== -1) {
            return { position: reusableWaypointIndex, createWaypoint: false };
        }

        const position = await this.findOptimalInsertPosition(context, agentIndex, firstJobIndex);
        return { position, createWaypoint: true };
    }

    static async findOptimalInsertPosition(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndex: number
    ): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation = RouteEditorHelper.resolveJobLocation(context, job);
        const agentFeature = context.getAgentFeature(agentIndex);

        if (!agentFeature) {
            return 1;
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        if (routeLocations.length === 0) {
            return 1;
        }

        const travelTimes = await this.calculateTravelTimes(context, routeLocations, jobLocation);
        const optimalIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocations,
            jobLocation,
            {
                canInsertBeforeFirst: !this.hasAgentStartLocation(context, agentIndex),
                canInsertAfterLast: !this.hasAgentEndLocation(context, agentIndex),
                travelTimes
            }
        );

        return optimalIndex;
    }

    static async findOptimalInsertPositionAfter(context: RouteResultEditorBase, agentIndex: number,
                                                jobIndex: number, minPosition: number): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation = RouteEditorHelper.resolveJobLocation(context, job);
        const agentFeature = context.getAgentFeature(agentIndex);
        const allRouteLocations = InsertPositionResolver.extractRouteLocations(agentFeature);

        const routeStartIndex = Math.max(0, minPosition);
        const routeLocationsAfter = allRouteLocations.slice(routeStartIndex);
        if (routeLocationsAfter.length === 0) {
            return routeStartIndex;
        }

        const travelTimes = await this.calculateTravelTimes(context, routeLocationsAfter, jobLocation);
        const optimalIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocationsAfter,
            jobLocation,
            { canInsertBeforeFirst: false,
              canInsertAfterLast: !this.hasAgentEndLocation(context, agentIndex),
              travelTimes
            }
        );

        return routeStartIndex + optimalIndex;
    }

    private static async calculateTravelTimes(
        context: RouteResultEditorBase,
        route: [number, number][],
        newLocation: [number, number]
    ): Promise<InsertionTravelTimes> {
        const matrixHelper = context.getMatrixHelper();
        const [timesToNew, timesFromNew] = await Promise.all([
            matrixHelper.calculateTimesToLocation(route, newLocation),
            matrixHelper.calculateTimesFromLocation(newLocation, route)
        ]);

        const travelTimes: InsertionTravelTimes = [];
        for (let i = 0; i < route.length; i++) {
            travelTimes.push({
                locationFrom: route[i],
                locationTo: newLocation,
                time: timesToNew[i]
            });
            travelTimes.push({
                locationFrom: newLocation,
                locationTo: route[i],
                time: timesFromNew[i]
            });
        }

        return travelTimes;
    }

    private static findExistingWaypointByLocation(
        waypoints: { original_location: [number, number]; location?: [number, number] }[],
        targetLocation: [number, number],
        minWaypointIndex: number
    ): number {
        for (let i = Math.max(0, minWaypointIndex); i < waypoints.length; i++) {
            const waypointLocation = waypoints[i].original_location|| waypoints[i].location;
            if (this.sameLocation(waypointLocation, targetLocation)) {
                return i;
            }
        }
        return -1;
    }

    private static sameLocation(a: [number, number], b: [number, number]): boolean {
        return Math.abs(a[0] - b[0]) <= LOCATION_EPSILON &&
            Math.abs(a[1] - b[1]) <= LOCATION_EPSILON;
    }
}
