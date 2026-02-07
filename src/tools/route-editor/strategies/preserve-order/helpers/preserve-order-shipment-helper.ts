import {RouteResultEditorBase} from "../../../route-result-editor-base";
import { ShipmentValidationHelper} from "../validations";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import { AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator} from "../utils/insertion-cost-calculator";

export class PreserveOrderShipmentHelper extends PreserveOrderBaseHelper {
     static validateShipmentConstraints(
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

     static async determineShipmentInsertPositions(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number,
        options: AddAssignOptions
    ): Promise<{ pickup: number; delivery: number }> {
        // append: true (no position) → Append to end
        if (InsertPositionResolver.shouldAppend(options)) {
            return this.getEndPositions(context, agentIndex);
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const pickupPosition = InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
            return { pickup: pickupPosition, delivery: pickupPosition + 1 };
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (InsertPositionResolver.shouldOptimizeAfterPosition(options)) {
            const minPosition = InsertPositionResolver.getMinimumWaypointPosition(context, agentIndex, options);
            return await this.findOptimalShipmentPositionsAfter(context, agentIndex, shipmentIndex, minPosition);
        }

        // No position params → Use Route Matrix API to find optimal positions anywhere
        return await this.findOptimalShipmentPositions(context, agentIndex, shipmentIndex);
    }

    static getEndPositions(context: RouteResultEditorBase, agentIndex: number): { pickup: number; delivery: number } {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        return { pickup: endActionIndex, delivery: endActionIndex + 1 };
    }

    static async findOptimalShipmentPositions(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number
    ): Promise<{ pickup: number; delivery: number }> {
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.pickup!);
        const deliveryLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.delivery!);

        const agentFeature = context.getAgentFeature(agentIndex);
        if (!agentFeature) {
            return { pickup: 1, delivery: 2 };
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        if (routeLocations.length === 0) {
            return { pickup: 1, delivery: 2 };
        }

        const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocations,
            pickupLocation
        );

        const routeWithPickup = [...routeLocations];
        routeWithPickup.splice(pickupIndex, 0, pickupLocation);

        const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeWithPickup.slice(pickupIndex + 1),
            deliveryLocation,
            false
        );

        return {
            pickup: pickupIndex + 1,
            delivery: pickupIndex + 1 + deliveryIndex + 1 + 1
        };
    }

    static async findOptimalShipmentPositionsAfter(context: RouteResultEditorBase, agentIndex: number,
                                                   shipmentIndex: number, minPosition: number): Promise<{ pickup: number; delivery: number }> {
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.pickup!);
        const deliveryLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.delivery!);

        const agentFeature = context.getAgentFeature(agentIndex);
        const allRouteLocations = InsertPositionResolver.extractRouteLocations(agentFeature);

        const routeLocationsAfter = allRouteLocations.slice(Math.max(0, minPosition - 1));
        if (routeLocationsAfter.length === 0) {
            return { pickup: minPosition, delivery: minPosition + 1 };
        }

        const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeLocationsAfter,
            pickupLocation
        );
        const absolutePickupPosition = Math.max(0, minPosition - 1) + pickupIndex + 1;

        const routeWithPickup = [...allRouteLocations];
        routeWithPickup.splice(absolutePickupPosition - 1, 0, pickupLocation);

        const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            agentIndex,
            routeWithPickup.slice(absolutePickupPosition),
            deliveryLocation,
            false
        );

        return {
            pickup: absolutePickupPosition,
            delivery: absolutePickupPosition + deliveryIndex + 1
        };
    }
}