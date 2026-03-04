import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import {AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator} from "../utils/insertion-cost-calculator";

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
        let position: number;

        // append: true (no position) → Append
        if (InsertPositionResolver.shouldAppend(options)) {
            position = await this.getEndPosition(context, agentIndex);
            return { position, createWaypoint: true };
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            position = InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
            return { position, createWaypoint: true };
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (InsertPositionResolver.shouldOptimizeAfterPosition(options)) {
            const minPosition = InsertPositionResolver.getMinimumWaypointPosition(context, agentIndex, options);
            position = await this.findOptimalInsertPositionAfter(context, agentIndex, firstJobIndex, minPosition);
            return { position, createWaypoint: true };
        }

        // No position params → Use Route Matrix API to find optimal position anywhere
        position = await this.findOptimalInsertPosition(context, agentIndex, firstJobIndex);
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

        const optimalIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocations,
            jobLocation,
            {
                canInsertBeforeFirst: this.hasAgentStartLocation(context, agentIndex),
                canInsertAfterLast: this.hasAgentEndLocation(context, agentIndex)
            }
        );

        return optimalIndex + 1;
    }

    static async findOptimalInsertPositionAfter(context: RouteResultEditorBase, agentIndex: number,
                                                jobIndex: number, minPosition: number): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation = RouteEditorHelper.resolveJobLocation(context, job);
        const agentFeature = context.getAgentFeature(agentIndex);
        const allRouteLocations = InsertPositionResolver.extractRouteLocations(agentFeature);

        const routeLocationsAfter = allRouteLocations.slice(Math.max(0, minPosition - 1));
        if (routeLocationsAfter.length === 0) {
            return minPosition;
        }

        const optimalIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocationsAfter,
            jobLocation,
            { canInsertBeforeFirst: minPosition === 0 ? this.hasAgentStartLocation(context, agentIndex) : true,
              canInsertAfterLast: this.hasAgentEndLocation(context, agentIndex)
            }
        );

        return Math.max(0, minPosition - 1) + optimalIndex + 1;
    }
}
