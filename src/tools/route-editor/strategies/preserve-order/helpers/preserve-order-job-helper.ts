import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {JobValidationHelper} from "../validations";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import {ActionResponseData, AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator} from "../utils/insertion-cost-calculator";

export class PreserveOrderJobHelper extends PreserveOrderBaseHelper {
     static validateJobConstraints(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[]
    ): void {
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];

        const existingJobIndexes = context.getAgentJobs(agentIndex);
        const existingJobs = existingJobIndexes.map(i => rawData.properties.params.jobs[i]);
        const newJobs = jobIndexes.map(i => rawData.properties.params.jobs[i]);
        const allJobs = [...existingJobs, ...newJobs];

        const violations = JobValidationHelper.validateAll(agent, allJobs, agentIndex);
        this.addViolationsToResult(rawData, violations);
    }

    static async determineInsertPosition(
        context: RouteResultEditorBase,
        agentIndex: number,
        firstJobIndex: number,
        options: AddAssignOptions
    ): Promise<number> {
        // append: true (no position) → Append
        if (InsertPositionResolver.shouldAppend(options)) {
            return this.getEndPosition(context, agentIndex);
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            return InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (InsertPositionResolver.shouldOptimizeAfterPosition(options)) {
            const minPosition = InsertPositionResolver.getMinimumWaypointPosition(context, agentIndex, options);
            return await this.findOptimalInsertPositionAfter(context, agentIndex, firstJobIndex, minPosition);
        }

        // No position params → Use Route Matrix API to find optimal position anywhere
        return await this.findOptimalInsertPosition(context, agentIndex, firstJobIndex);
    }

    static insertJobActionsAtPosition(
        context: RouteResultEditorBase,
        actions: ActionResponseData[],
        jobIndexes: number[],
        insertPosition: number
    ): void {
        for (let i = 0; i < jobIndexes.length; i++) {
            const newAction = RouteEditorHelper.createJobAction(context, jobIndexes[i], insertPosition + i);
            actions.splice(insertPosition + i, 0, newAction);
        }
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
            jobLocation
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
            jobLocation
        );

        return Math.max(0, minPosition - 1) + optimalIndex + 1;
    }
}