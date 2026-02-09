import { AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions } from "../../../../models";
import { 
    AssignStrategy
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {RouteEditorHelper, RouteTimeRecalculator, WaypointBuilder} from "../preserve-order";
import {PreserveOrderShipmentHelper} from "../preserve-order/helpers/preserve-order-shipment-helper";
import {RouteViolationValidator} from "../preserve-order/validations";
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
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        for (const shipmentIndex of shipmentIndexes) {
            const positions = await PreserveOrderShipmentHelper.determineShipmentInsertPositions(context, agentIndex, shipmentIndex, options);
            
            const pickupAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'pickup', positions.pickup);
            const deliveryAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'delivery', positions.delivery);
            
            actions.splice(positions.pickup, 0, pickupAction);
            actions.splice(positions.delivery, 0, deliveryAction);
            
            context.reindexActions(actions);
            
            WaypointBuilder.insertShipmentWaypoints(
                context, 
                agentIndex, 
                shipmentIndex, 
                positions.pickup, 
                positions.delivery
            );
        }

        await RouteTimeRecalculator.recalculate(context, agentIndex);
        
        RouteViolationValidator.validate(context, agentIndex);
        
        this.removeFromUnassignedShipments(context, shipmentIndexes);
        
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

    private removeFromUnassignedShipments(context: RouteResultEditorBase, shipmentIndexes: number[]): void {
        const rawData = context.getRawData();
        const issues = rawData.properties.issues;
        if (!issues?.unassigned_shipments) {
            return;
        }

        issues.unassigned_shipments = issues.unassigned_shipments
            .filter((shipmentIndex: number) => !shipmentIndexes.includes(shipmentIndex));
    }
}

