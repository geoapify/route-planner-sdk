import {RouteResultEditorBase} from "../../../route-result-editor-base";
import { ShipmentValidationHelper} from "../validations";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import { AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";

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
        // append: true → Append to end
        if (InsertPositionResolver.shouldAppendToEnd(options)) {
            return this.getEndPositions(context, agentIndex);
        }

        // afterId/insertAtIndex → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const pickupPosition = InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
            return { pickup: pickupPosition, delivery: pickupPosition + 1 };
        }

        // No position params → Use Route Matrix API to find optimal positions
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
            return { pickup: 1, delivery: 2 }; // After start action
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        if (routeLocations.length === 0) {
            return { pickup: 1, delivery: 2 }; // After start action
        }

        const matrixHelper = context.getMatrixHelper();
        const pickupIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, pickupLocation);

        const routeWithPickup = [...routeLocations];
        routeWithPickup.splice(pickupIndex, 0, pickupLocation);

        const deliveryIndex = await matrixHelper.findOptimalInsertionPoint(
            routeWithPickup.slice(pickupIndex + 1),
            deliveryLocation
        );

        return {
            pickup: pickupIndex + 1,
            delivery: pickupIndex + 1 + deliveryIndex + 1 + 1
        };
    }
}