import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import { AddAssignOptions} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator} from "../utils/insertion-cost-calculator";
import {WaypointResponseData} from "../../../../../models";

const LOCATION_EPSILON = 1e-6;

export interface ShipmentInsertPositions {
    pickup: number;
    delivery: number;
    createPickupWaypoint: boolean;
    createDeliveryWaypoint: boolean;
}

export class PreserveOrderShipmentHelper extends PreserveOrderBaseHelper {

    static async determineShipmentInsertPositions(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number,
        options: AddAssignOptions
    ): Promise<ShipmentInsertPositions> {
        // append: true (no position) → Append to end
        if (InsertPositionResolver.shouldAppend(options)) {
            const positions = await this.getEndPositions(context, agentIndex);
            return {
                ...positions,
                createPickupWaypoint: true,
                createDeliveryWaypoint: true
            };
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const agentFeature = await context.getOrCreateAgentFeature(agentIndex);
            const pickupPosition = this.actionPositionToWaypointInsertIndex(
                agentFeature.properties.waypoints || [],
                InsertPositionResolver.resolveInsertPosition(context, agentIndex, options)
            );
            return {
                pickup: pickupPosition,
                delivery: pickupPosition + 1,
                createPickupWaypoint: true,
                createDeliveryWaypoint: true
            };
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (InsertPositionResolver.shouldOptimizeAfterPosition(options)) {
            const agentFeature = await context.getOrCreateAgentFeature(agentIndex);
            const minActionPosition = InsertPositionResolver.getMinimumWaypointPosition(context, agentIndex, options);
            const minWaypointPosition = this.actionPositionToWaypointInsertIndex(
                agentFeature.properties.waypoints || [],
                minActionPosition
            );
            return await this.findOptimalShipmentPositionsAfter(context, agentIndex, shipmentIndex, minWaypointPosition);
        }

        // No position params → Use Route Matrix API to find optimal positions anywhere
        return await this.findOptimalShipmentPositions(context, agentIndex, shipmentIndex);
    }

    static async getEndPositions(context: RouteResultEditorBase, agentIndex: number): Promise<{ pickup: number; delivery: number }> {
        const agentFeature = await context.getOrCreateAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints || [];
        const actions = agentFeature.properties.actions || [];
        const endActionIndex = context.findEndActionIndex(actions);
        const pickup = this.actionPositionToWaypointInsertIndex(
            waypoints,
            endActionIndex >= 0 ? endActionIndex : actions.length
        );

        return { pickup, delivery: pickup + 1 };
    }

    static async findOptimalShipmentPositions(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number
    ): Promise<ShipmentInsertPositions> {

        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.pickup!);
        const deliveryLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.delivery!);

        const agentFeature = context.getAgentFeature(agentIndex);

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        const waypoints = agentFeature.properties.waypoints || [];

        const pickupExistingWaypointIndex = this.findExistingWaypointByOriginalLocation(waypoints, pickupLocation, 0);
        const deliveryExistingWaypointIndex = this.findExistingWaypointByOriginalLocation(waypoints, deliveryLocation, 0);

        let createPickupWaypoint = true;
        let createDeliveryWaypoint = true;
        let pickup = 0;
        let delivery = 0;

        if (pickupExistingWaypointIndex !== -1) {
            createPickupWaypoint = false;
            pickup = pickupExistingWaypointIndex;
        } else if (deliveryExistingWaypointIndex !== -1) {
            const pickupRouteBeforeDelivery = routeLocations.slice(0, deliveryExistingWaypointIndex + 1);
            const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                pickupRouteBeforeDelivery,
                pickupLocation,
                {   canInsertBeforeFirst: this.hasAgentStartLocation(context, agentIndex),
                    canInsertAfterLast: false }
            );

            pickup = pickupIndex;
        } else if (routeLocations.length === 0) {
            pickup = 0;
        } else if (routeLocations.length === 1) {
            pickup = this.hasAgentStartLocation(context, agentIndex) ? 1 : 0;
        } else {
            const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeLocations,
                pickupLocation,
                {   canInsertBeforeFirst: this.hasAgentStartLocation(context, agentIndex),
                    canInsertAfterLast: this.hasAgentEndLocation(context, agentIndex) }
            );

            pickup = pickupIndex;
        }

        const canReuseDeliveryWaypoint =
            deliveryExistingWaypointIndex !== -1 &&
            deliveryExistingWaypointIndex >= pickup;

        if (canReuseDeliveryWaypoint) {
            createDeliveryWaypoint = false;
            delivery = deliveryExistingWaypointIndex;
        } else {
            const routeWithPickup = [...routeLocations];
            if (createPickupWaypoint) {
                routeWithPickup.splice(pickup, 0, pickupLocation);
            }

            const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeWithPickup.slice(pickup),
                deliveryLocation,
                { canInsertBeforeFirst: false }
            );

            delivery = pickup + deliveryIndex;
        }

        return {
            pickup,
            delivery,
            createPickupWaypoint,
            createDeliveryWaypoint
        };
    }

    static async findOptimalShipmentPositionsAfter(context: RouteResultEditorBase, agentIndex: number,
                                                   shipmentIndex: number, minPosition: number): Promise<ShipmentInsertPositions> {
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.pickup!);
        const deliveryLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.delivery!);

        const agentFeature = context.getAgentFeature(agentIndex);
        const allRouteLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        const waypoints = agentFeature.properties.waypoints || [];

        const pickupExistingWaypointIndex = this.findExistingWaypointByOriginalLocation(waypoints, pickupLocation, 0);
        const deliveryExistingWaypointIndex = this.findExistingWaypointByOriginalLocation(waypoints, deliveryLocation, 0);

        let createPickupWaypoint = true;
        let createDeliveryWaypoint = true;
        let pickup = 0;
        let delivery = 0;
        let pickupRouteIndex = -1;

        if (pickupExistingWaypointIndex !== -1) {
            if (pickupExistingWaypointIndex >= minPosition) {
                createPickupWaypoint = false;
                pickup = pickupExistingWaypointIndex;
                pickupRouteIndex = pickupExistingWaypointIndex;
            }
        }

        if (pickupRouteIndex === -1) {
            const routeStartIndex = Math.max(0, minPosition);
            const hasDeliveryAfterMin =
                deliveryExistingWaypointIndex !== -1 && deliveryExistingWaypointIndex >= routeStartIndex;

            let pickupIndexRelative: number;
            let routeBeforeDelivery: [number, number][] | null = null;
            if (hasDeliveryAfterMin) {
                routeBeforeDelivery = allRouteLocations.slice(routeStartIndex, deliveryExistingWaypointIndex + 1);
            }

            const routeLocationsAfter = routeBeforeDelivery ?? allRouteLocations.slice(routeStartIndex);

            if (routeLocationsAfter.length === 0) {
                pickup = routeStartIndex;
                pickupRouteIndex = routeStartIndex;
            } else {
                const pickupOptions = routeBeforeDelivery
                    ? { canInsertBeforeFirst: true, canInsertAfterLast: false }
                    : { canInsertBeforeFirst: true };

                pickupIndexRelative = await InsertionCostCalculator.findOptimalInsertionPoint(
                    context,
                    agentIndex,
                    routeLocationsAfter,
                    pickupLocation,
                    pickupOptions
                );

                pickupRouteIndex = routeStartIndex + pickupIndexRelative;
                pickup = pickupRouteIndex;
            }
        }

        const canReuseDeliveryWaypoint =
            deliveryExistingWaypointIndex !== -1 &&
            deliveryExistingWaypointIndex >= pickupRouteIndex;

        if (canReuseDeliveryWaypoint) {
            createDeliveryWaypoint = false;
            delivery = deliveryExistingWaypointIndex;
        } else {
            const routeWithPickup = [...allRouteLocations];
            if (createPickupWaypoint) {
                routeWithPickup.splice(pickupRouteIndex, 0, pickupLocation);
            }

            const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeWithPickup.slice(pickupRouteIndex + 1),
                deliveryLocation,
                { canInsertBeforeFirst: true }
            );

            delivery = pickup + deliveryIndex + 1;
        }

        return {
            pickup,
            delivery,
            createPickupWaypoint,
            createDeliveryWaypoint
        };
    }

    private static actionPositionToWaypointInsertIndex(
        waypoints: WaypointResponseData[],
        actionPosition: number
    ): number {
        const normalizedActionPosition = Math.max(0, actionPosition);
        let cumulativeActionCount = 0;

        for (let waypointIndex = 0; waypointIndex < waypoints.length; waypointIndex++) {
            cumulativeActionCount += waypoints[waypointIndex].actions?.length ?? 0;

            if (normalizedActionPosition <= cumulativeActionCount) {
                return waypointIndex + 1;
            }
        }

        return waypoints.length;
    }

    private static findExistingWaypointByOriginalLocation(
        waypoints: WaypointResponseData[],
        targetLocation: [number, number],
        minWaypointIndex: number
    ): number {
        for (let i = Math.max(0, minWaypointIndex); i < waypoints.length; i++) {
            if (this.sameLocation(waypoints[i].original_location, targetLocation)) {
                return i;
            }
        }

        return -1;
    }

    private static sameLocation(a: [number, number], b: [number, number]): boolean {
        return Math.abs(a[0] - b[0]) <= LOCATION_EPSILON &&
            Math.abs(a[1] - b[1]) <= LOCATION_EPSILON;
    }
}
