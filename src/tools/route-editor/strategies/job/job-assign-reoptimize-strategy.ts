import { AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions } from "../../../../models";
import { AssignStrategy, RequirementHelper } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";
import { RouteViolationValidator } from "../preserve-order/validations";
import { JobRemovePreserveOrderStrategy } from "./job-remove-preserve-order-strategy";
import { JobRemoveReoptimizeStrategy } from "./job-remove-reoptimize-strategy";

/**
 * Strategy that reoptimizes only the target agent when assigning jobs
 */
export class JobAssignReoptimizeStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        await this.removeJobsFromCurrentAgents(context, jobIndexes, options);

        const targetJobIndexes = new Set<number>(context.getAgentJobs(agentIndex));
        jobIndexes.forEach((jobIndex) => targetJobIndexes.add(jobIndex));
        const targetShipmentIndexes = new Set<number>(context.getAgentShipments(agentIndex));

        const inputData = context.cloneInputData();
        const targetAgent = inputData.agents[agentIndex];
        if (!targetAgent) {
            return false;
        }

        RequirementHelper.extendAgentTimeWindows(targetAgent);
        this.clearTimeWindowsForAssignedJobs(inputData.jobs || [], jobIndexes);

        inputData.agents = [targetAgent];
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.jobs || [], targetJobIndexes);
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.shipments || [], targetShipmentIndexes);

        const result = await context.executeAgentPlan(agentIndex, inputData);
        RouteViolationValidator.validate(context, agentIndex);
        return result;
    }

    private async removeJobsFromCurrentAgents(
        context: RouteResultEditorBase,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<void> {
        const removeStrategyType = options.removeStrategy ?? PRESERVE_ORDER;
        const removeStrategy = removeStrategyType === REOPTIMIZE
            ? new JobRemoveReoptimizeStrategy()
            : new JobRemovePreserveOrderStrategy();
        const removeOptions: RemoveOptions = { strategy: removeStrategyType };

        await removeStrategy.execute(context, jobIndexes, removeOptions);
    }

    private clearTimeWindowsForAssignedJobs(jobs: any[], assignedJobIndexes: number[]): void {
        for (const jobIndex of assignedJobIndexes) {
            const job = jobs[jobIndex];
            if (!job) {
                continue;
            }
            delete job.time_windows;
        }
    }
}
