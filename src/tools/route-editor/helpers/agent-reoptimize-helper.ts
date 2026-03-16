import { AgentData, InvalidParameter, ReoptimizeOptions } from "../../../models";
import { IndexConverter } from "../../../helpers/index-converter";
import { RequirementHelper } from "../strategies/base/requirement-helper";
import { RouteResultEditorBase } from "../route-result-editor-base";
import { RouteViolationValidator } from "../validations";

export class AgentReoptimizeHelper {
    private static readonly MAX_CAPACITY = 2147483647;

    static async execute(context: RouteResultEditorBase, options: ReoptimizeOptions): Promise<boolean> {
        if (options.agentIdOrIndex === undefined) {
            throw new InvalidParameter("agentIdOrIndex is required", "agentIdOrIndex");
        }

        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), options.agentIdOrIndex, true);
        const targetJobIndexes = new Set<number>(context.getAgentJobs(agentIndex));
        const targetShipmentIndexes = new Set<number>(context.getAgentShipments(agentIndex));

        if (options.includeUnassigned) {
            this.addUnassignedIndexes(targetJobIndexes, context.getRawData().properties.issues?.unassigned_jobs);
            this.addUnassignedIndexes(targetShipmentIndexes, context.getRawData().properties.issues?.unassigned_shipments);
        }

        if (targetJobIndexes.size === 0 && targetShipmentIndexes.size === 0) {
            return true;
        }

        const inputData = context.cloneInputData();
        const targetAgent = inputData.agents[agentIndex] as AgentData;
        if (!targetAgent) {
            return true;
        }

        if (options.allowViolations) {
            this.removeViolationsFromInput(
                targetAgent,
                inputData.jobs || [],
                inputData.shipments || [],
                targetJobIndexes,
                targetShipmentIndexes
            );
        }

        inputData.agents = [targetAgent];
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.jobs || [], targetJobIndexes);
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.shipments || [], targetShipmentIndexes);

        await context.executeAgentPlan(agentIndex, inputData);
        RouteViolationValidator.validate(context, agentIndex);
        context.updateIssues();
        return true;
    }

    private static addUnassignedIndexes(targetIndexes: Set<number>, unassignedIndexes?: number[]): void {
        if (!unassignedIndexes?.length) {
            return;
        }

        for (const index of unassignedIndexes) {
            targetIndexes.add(index);
        }
    }

    private static removeViolationsFromInput(
        targetAgent: any,
        jobs: any[],
        shipments: any[],
        targetJobIndexes: Set<number>,
        targetShipmentIndexes: Set<number>
    ): void {
        RequirementHelper.extendAgentTimeWindows(targetAgent);
        delete targetAgent.breaks;
        if (Object.prototype.hasOwnProperty.call(targetAgent, "pickup_capacity")) {
            targetAgent.pickup_capacity = this.MAX_CAPACITY;
        }
        if (Object.prototype.hasOwnProperty.call(targetAgent, "delivery_capacity")) {
            targetAgent.delivery_capacity = this.MAX_CAPACITY;
        }

        for (const jobIndex of targetJobIndexes) {
            const job = jobs[jobIndex];
            if (job) {
                delete job.time_windows;
            }
        }

        for (const shipmentIndex of targetShipmentIndexes) {
            const shipment = shipments[shipmentIndex];
            if (!shipment) {
                continue;
            }

            if (shipment.pickup) {
                delete shipment.pickup.time_windows;
            }
            if (shipment.delivery) {
                delete shipment.delivery.time_windows;
            }
        }
    }
}
