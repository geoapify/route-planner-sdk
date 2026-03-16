import { AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions } from "../../../../models";
import { 
    AssignStrategy
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {AgentPlanRecalculator, WaypointBuilder} from "../preserve-order";
import {
    PreserveOrderShipmentHelper,
    ShipmentInsertPositions
} from "../preserve-order/helpers/preserve-order-shipment-helper";
import {RouteViolationValidator} from "../../validations";
import {ShipmentRemovePreserveOrderStrategy} from "./shipment-remove-preserve-order-strategy";
import {ShipmentRemoveReoptimizeStrategy} from "./shipment-remove-reoptimize-strategy";

/**
 * Strategy that inserts shipments while preserving the order of existing stops.
 * Considers pickup-delivery constraints (pickup must come before delivery).
 * 
 * Behavior:
 * - append: true → Appends pickup and delivery to end of route (no API call)
 * - afterId/insertAtIndex → Inserts at specified position (no API call)
 * - No position params → Uses Route Matrix API to find optimal insertion points
 */
export class ShipmentAssignPreserveOrderStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        await this.removeShipmentsFromCurrentAgents(context, shipmentIndexes, options);
        
        for (const shipmentIndex of shipmentIndexes) {
            const positions: ShipmentInsertPositions =
                await PreserveOrderShipmentHelper.determineShipmentInsertPositions(context, agentIndex, shipmentIndex, options);
                        
            WaypointBuilder.insertShipmentWaypoints(
                context, 
                agentIndex, 
                shipmentIndex, 
                positions
            );

            await AgentPlanRecalculator.recalculate(context, agentIndex);
        }

        RouteViolationValidator.validate(context, agentIndex);
        
        return true;
    }

    private async removeShipmentsFromCurrentAgents(context: RouteResultEditorBase, shipmentIndexes: number[],
                                                   options: AddAssignOptions): Promise<void> {
        const removeStrategyType = options.removeStrategy ?? PRESERVE_ORDER;
        const removeStrategy = removeStrategyType === REOPTIMIZE 
            ? new ShipmentRemoveReoptimizeStrategy() 
            : new ShipmentRemovePreserveOrderStrategy();
        const removeOptions: RemoveOptions = { strategy: removeStrategyType };
        await removeStrategy.execute(context, shipmentIndexes, removeOptions);
    }
}
