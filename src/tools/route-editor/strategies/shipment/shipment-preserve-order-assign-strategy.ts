import { AddAssignOptions, ViolationError } from "../../../../models";
import { 
    AssignStrategy, 
    RouteEditorHelper,
    RouteTimeCalculator,
    InsertPositionResolver,
    WaypointBuilder
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import { ShipmentValidationHelper } from "../../validations";

/**
 * Strategy that inserts shipments while preserving the order of existing stops.
 * Considers pickup-delivery constraints (pickup must come before delivery).
 * 
 * Behavior:
 * - appendToEnd: true → Appends pickup and delivery to end of route (no API call)
 * - beforeId/afterId/insertAtIndex → Inserts at specified position (no API call)
 * - No position params → Uses Route Matrix API to find optimal insertion points
 */
export class ShipmentPreserveOrderAssignStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        this.validateShipmentConstraints(context, agentIndex, shipmentIndexes);
        
        RouteEditorHelper.removeShipmentsFromAgents(context, shipmentIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        for (const shipmentIndex of shipmentIndexes) {
            const positions = await this.determineShipmentInsertPositions(context, agentIndex, shipmentIndex, options);
            
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

        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getShipmentActionLocation
        );
        return true;
    }

    private validateShipmentConstraints(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[]
    ): void {
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        
        const existingShipmentIndexes = context.getAgentShipments(agentIndex);
        const existingShipments = existingShipmentIndexes.map(i => rawData.properties.params.shipments[i]);
        const newShipments = shipmentIndexes.map(i => rawData.properties.params.shipments[i]);
        const allShipments = [...existingShipments, ...newShipments];
        
        const violations = ShipmentValidationHelper.validateAll(agent, allShipments, agentIndex);
        this.addViolationsToResult(rawData, violations);
    }

    private addViolationsToResult(rawData: any, violations: ViolationError[]): void {
        if (violations.length === 0) return;
        
        if (!rawData.properties.agentViolations) {
            rawData.properties.agentViolations = {};
        }
        
        violations.forEach(violation => {
            const agentIndex = violation.agentIndex;
            if (!rawData.properties.agentViolations![agentIndex]) {
                rawData.properties.agentViolations![agentIndex] = [];
            }
            rawData.properties.agentViolations![agentIndex].push(violation);
        });
    }

    private async determineShipmentInsertPositions(
        context: RouteResultEditorBase,
        agentIndex: number, 
        shipmentIndex: number, 
        options: AddAssignOptions
    ): Promise<{ pickup: number; delivery: number }> {
        // appendToEnd: true → Append to end
        if (InsertPositionResolver.shouldAppendToEnd(options)) {
            return this.getEndPositions(context, agentIndex);
        }
        
        // beforeId/afterId/insertAtIndex → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const pickupPosition = InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
            return { pickup: pickupPosition, delivery: pickupPosition + 1 };
        }
        
        // No position params → Use Route Matrix API to find optimal positions
        return await this.findOptimalShipmentPositions(context, agentIndex, shipmentIndex);
    }

    private getEndPositions(context: RouteResultEditorBase, agentIndex: number): { pickup: number; delivery: number } {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        return { pickup: endActionIndex, delivery: endActionIndex + 1 };
    }

    private async findOptimalShipmentPositions(
        context: RouteResultEditorBase,
        agentIndex: number, 
        shipmentIndex: number
    ): Promise<{ pickup: number; delivery: number }> {
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation: [number, number] = shipment.pickup!.location!;
        const deliveryLocation: [number, number] = shipment.delivery!.location!;

        const agentFeature = context.getAgentFeature(agentIndex);
        if (!agentFeature) {
            return { pickup: 1, delivery: 2 }; // After start action
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        
        if (routeLocations.length === 0) {
            return { pickup: 1, delivery: 2 }; // After start action
        }

        const matrixHelper = context.getMatrixHelper();

        // Find optimal position for pickup
        const pickupIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, pickupLocation);
        
        // Add pickup to route and find optimal position for delivery (must be after pickup)
        const routeWithPickup = [...routeLocations];
        routeWithPickup.splice(pickupIndex, 0, pickupLocation);
        
        // Find optimal delivery position after pickup
        const deliveryIndex = await matrixHelper.findOptimalInsertionPoint(
            routeWithPickup.slice(pickupIndex + 1),
            deliveryLocation
        );

        return { 
            pickup: pickupIndex + 1, // +1 for 'start' action
            delivery: pickupIndex + 1 + deliveryIndex + 1 + 1 // +1 for start, +1 for pickup, +1 for delivery offset
        };
    }
}

