import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, RequirementHelper } from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import { RouteViolationValidator } from "../preserve-order/validations";

/**
 * Strategy that reoptimizes the route after removing shipments
 */
export class ShipmentRemoveReoptimizeStrategy implements IRemoveStrategy {

    async execute(
        context: RouteResultEditorBase,
        shipmentIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const shipmentsByAgent = new Map<number, number[]>();

        for (const shipmentIndex of shipmentIndexes) {
            const agentIndex = context.getAgentIndexForShipment(shipmentIndex);
            if (agentIndex === undefined) {
                continue;
            }

            if (!shipmentsByAgent.has(agentIndex)) {
                shipmentsByAgent.set(agentIndex, []);
            }
            shipmentsByAgent.get(agentIndex)!.push(shipmentIndex);
        }

        for (const [agentIndex, removedShipmentIndexes] of shipmentsByAgent.entries()) {
            const removedSet = new Set(removedShipmentIndexes);
            const remainingShipments = context
                .getAgentShipments(agentIndex)
                .filter((index) => !removedSet.has(index));
            const targetShipmentIndexes = new Set<number>(remainingShipments);

            const inputData = context.cloneInputData();
            const targetJobIndexes = new Set<number>(context.getAgentJobs(agentIndex));

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
