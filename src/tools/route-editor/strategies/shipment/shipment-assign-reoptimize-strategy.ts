import { AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions } from "../../../../models";
import { AssignStrategy, RequirementHelper } from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import { ShipmentRemovePreserveOrderStrategy } from "./shipment-remove-preserve-order-strategy";
import { ShipmentRemoveReoptimizeStrategy } from "./shipment-remove-reoptimize-strategy";
import { RouteViolationValidator } from "../preserve-order/validations";

/**
 * Strategy that reoptimizes only the target agent when assigning shipments
 */
export class ShipmentAssignReoptimizeStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        await this.removeShipmentsFromCurrentAgents(context, shipmentIndexes, options);

        const targetShipmentIndexes = new Set<number>(context.getAgentShipments(agentIndex));
        shipmentIndexes.forEach((shipmentIndex) => targetShipmentIndexes.add(shipmentIndex));
        const targetJobIndexes = new Set<number>(context.getAgentJobs(agentIndex));

        const inputData = context.cloneInputData();
        const targetAgent = inputData.agents[agentIndex];
        if (!targetAgent) {
            return false;
        }

        RequirementHelper.extendAgentTimeWindows(targetAgent);
        this.clearTimeWindowsForAssignedShipments(inputData.shipments || [], shipmentIndexes);

        inputData.agents = [targetAgent];
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.jobs || [], targetJobIndexes);
        RequirementHelper.restrictAssignmentsToTargetSet(inputData.shipments || [], targetShipmentIndexes);

        await context.executeAgentPlan(agentIndex, inputData);
        RouteViolationValidator.validate(context, agentIndex);
        return true;
    }

    private async removeShipmentsFromCurrentAgents(
        context: RouteResultEditorBase,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<void> {
        const removeStrategyType = options.removeStrategy ?? PRESERVE_ORDER;
        const removeStrategy = removeStrategyType === REOPTIMIZE
            ? new ShipmentRemoveReoptimizeStrategy()
            : new ShipmentRemovePreserveOrderStrategy();
        const removeOptions: RemoveOptions = { strategy: removeStrategyType };

        await removeStrategy.execute(context, shipmentIndexes, removeOptions);
    }

    private clearTimeWindowsForAssignedShipments(shipments: any[], assignedShipmentIndexes: number[]): void {
        for (const shipmentIndex of assignedShipmentIndexes) {
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
