import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, RequirementHelper } from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";

/**
 * Strategy that reoptimizes the route after removing jobs
 */
export class JobRemoveReoptimizeStrategy implements IRemoveStrategy {

    async execute(
        context: RouteResultEditorBase,
        jobIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const inputData = context.cloneInputData();
        
        RequirementHelper.markItemsAsUnassigned(inputData.jobs, jobIndexes);
        RequirementHelper.markExistingUnassignedJobs(context, inputData.jobs);
        RequirementHelper.markRemainingJobsWithAgentRequirement(context, inputData.jobs, jobIndexes);
        context.addAgentCapabilities(inputData.agents);

        return context.executePlan(inputData);
    }
}
