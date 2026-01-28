import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {RouteEditorHelper, RouteTimeCalculator, WaypointBuilder} from "../preserve-order";
import {PreserveOrderShipmentHelper} from "../preserve-order/helpers/preserve-order-shipment-helper";

/**
 * Strategy that inserts shipments while preserving the order of existing stops.
 * Considers pickup-delivery constraints (pickup must come before delivery).
 * 
 * Behavior:
 * - appendToEnd: true → Appends pickup and delivery to end of route (no API call)
 * - beforeId/afterId/insertAtIndex → Inserts at specified position (no API call)
 * - No position params → Uses Route Matrix API to find optimal insertion points
 */
export class ShipmentAssignPreserveOrderStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        PreserveOrderShipmentHelper.validateShipmentConstraints(context, agentIndex, shipmentIndexes);
        
        RouteEditorHelper.removeShipmentsFromAgents(context, shipmentIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        for (const shipmentIndex of shipmentIndexes) {
            const positions = await PreserveOrderShipmentHelper.determineShipmentInsertPositions(context, agentIndex, shipmentIndex, options);
            
            const pickupAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'pickup', positions.pickup);
            const deliveryAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'delivery', positions.delivery);
            
            actions.splice(positions.pickup, 0, pickupAction);
            actions.splice(positions.delivery, 0, deliveryAction);
            
            context.reindexActions(actions);
            
            // Create waypoints for the added shipment
            WaypointBuilder.insertShipmentWaypoints(
                context, 
                agentIndex, 
                shipmentIndex, 
                positions.pickup, 
                positions.delivery
            );
        }

        await RouteTimeCalculator.recalculateRouteTimes(context, agentIndex, false);
        return true;
    }
}

