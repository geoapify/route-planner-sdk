import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {JobValidationHelper} from "../validations";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import {ActionResponseData, AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";

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
        // appendToEnd: true → Append to end
        if (InsertPositionResolver.shouldAppendToEnd(options)) {
            return this.getEndPosition(context, agentIndex);
        }

        // beforeId/afterId/insertAtIndex → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            return InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
        }

        // No position params → Use Route Matrix API to find optimal position
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
        const jobLocation: [number, number] = job.location!;
        const agentFeature = context.getAgentFeature(agentIndex);

        if (!agentFeature) {
            return 1; // After start action
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);

        if (routeLocations.length === 0) {
            return 1; // After start action
        }

        const matrixHelper = context.getMatrixHelper();
        const optimalIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, jobLocation);

        return optimalIndex + 1; // +1 to account for 'start' action
    }
}