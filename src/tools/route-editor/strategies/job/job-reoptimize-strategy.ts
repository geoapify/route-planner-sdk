import { AddAssignOptions } from "../../../../models";
import { AssignStrategy, RequirementHelper } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";

/**
 * Strategy that reoptimizes the entire route when assigning jobs
 */
export class JobReoptimizeStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        const inputData = context.cloneInputData();
        
        RequirementHelper.markExistingUnassignedJobs(context, inputData.jobs);
        RequirementHelper.assignItemsToAgent(inputData.jobs, jobIndexes, agentIndex);
        RequirementHelper.markRemainingJobsWithAgentRequirement(context, inputData.jobs, jobIndexes);
        context.addAgentCapabilities(inputData.agents);

        return context.executePlan(inputData);
    }
}
