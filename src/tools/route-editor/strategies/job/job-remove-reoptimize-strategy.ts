import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, RequirementHelper } from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import { RouteViolationValidator } from "../preserve-order/validations";

/**
 * Strategy that reoptimizes the route after removing jobs
 */
export class JobRemoveReoptimizeStrategy implements IRemoveStrategy {

    async execute(
        context: RouteResultEditorBase,
        jobIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const jobsByAgent = new Map<number, number[]>();

        for (const jobIndex of jobIndexes) {
            const agentIndex = context.getAgentIndexForJob(jobIndex);
            if (agentIndex === undefined) {
                continue;
            }

            if (!jobsByAgent.has(agentIndex)) {
                jobsByAgent.set(agentIndex, []);
            }
            jobsByAgent.get(agentIndex)!.push(jobIndex);
        }

        for (const [agentIndex, removedJobIndexes] of jobsByAgent.entries()) {
            const removedSet = new Set(removedJobIndexes);
            const remainingJobs = context
                .getAgentJobs(agentIndex)
                .filter((index) => !removedSet.has(index));
            const targetJobIndexes = new Set<number>(remainingJobs);

            const inputData = context.cloneInputData();
            const targetShipmentIndexes = new Set<number>(context.getAgentShipments(agentIndex));

            const targetAgent = inputData.agents[agentIndex];
            if (!targetAgent) {
                continue;
            }

            inputData.agents = [targetAgent];
            RequirementHelper.restrictAssignmentsToTargetSet(inputData.jobs || [], targetJobIndexes);
            RequirementHelper.restrictAssignmentsToTargetSet(inputData.shipments || [], targetShipmentIndexes);

            await context.executeAgentPlan(agentIndex, inputData);
            RouteViolationValidator.validate(context, agentIndex);
        }

        return true;
    }
}
