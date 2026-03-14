import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {PreserveOrderBaseHelper} from "./preserve-order-base-helper";
import { AddAssignOptions, AgentDeliveryCapacityExceeded} from "../../../../../models";
import {InsertPositionResolver} from "../utils/insert-position-resolver";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertionCostCalculator, InsertionTravelTimes} from "../utils/insertion-cost-calculator";
import {WaypointResponseData} from "../../../../../models";

const LOCATION_EPSILON = 1e-6;

export interface ShipmentInsertPositions {
    pickup: number;
    delivery: number;
    createPickupWaypoint?: boolean;
    createDeliveryWaypoint?: boolean;
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
            const positions = this.getAppendToEndPositions(context, agentIndex);
            return {
                ...positions,
                createPickupWaypoint: true,
                createDeliveryWaypoint: true
            };
        }

        // afterId/afterWaypointIndex + append: true → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const pickupPosition = InsertPositionResolver.resolveInsertPosition(options);
            return {
                pickup: pickupPosition,
                delivery: pickupPosition + 1,
                createPickupWaypoint: true,
                createDeliveryWaypoint: true
            };
        }

        // afterId/afterWaypointIndex + append: false → Optimize after position
        if (options.afterWaypointIndex !== undefined && !options.append) {
            const minWaypointPosition = options.afterWaypointIndex;
            return await this.findOptimalShipmentPositionsAfter(context, agentIndex, shipmentIndex, minWaypointPosition);
        }

        // No position params → Use Route Matrix API to find optimal positions anywhere
        return await this.findOptimalShipmentPositions(context, agentIndex, shipmentIndex);
    }

    static async getAppendToEndPositions(context: RouteResultEditorBase, agentIndex: number): Promise<{ pickup: number; delivery: number }> {
        const agentFeature = await context.getOrCreateAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints || [];
        const hasEndAction = waypoints[waypoints.length - 1].actions.some(action => action.type === 'end');

        if (hasEndAction) {
            return {
                pickup: waypoints.length - 2,
                delivery: waypoints.length - 1
            }
        } else {
            return { pickup: waypoints.length, delivery: waypoints.length + 1 };
        }        
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

        let pickupTravelTimes;

        // find pickup position
        if (pickupExistingWaypointIndex !== -1) {
            createPickupWaypoint = false;
            pickup = pickupExistingWaypointIndex;
        } else if (deliveryExistingWaypointIndex !== -1) {
            const pickupRouteBeforeDelivery = routeLocations.slice(0, deliveryExistingWaypointIndex + 1);
            pickupTravelTimes = await this.calculateTravelTimes(context, pickupRouteBeforeDelivery, pickupLocation);
            const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                pickupRouteBeforeDelivery,
                pickupLocation,
                {   canInsertBeforeFirst: !this.hasAgentStartLocation(context, agentIndex),
                    canInsertAfterLast: false,
                    travelTimes: pickupTravelTimes }
            );

            pickup = pickupIndex;
        } else if (routeLocations.length === 0) {
            pickup = 0;
        } else if (routeLocations.length === 1) {
            pickup = this.hasAgentStartLocation(context, agentIndex) ? 1 : 0;
        } else {
            pickupTravelTimes = await this.calculateTravelTimes(context, routeLocations, pickupLocation);
            const pickupIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeLocations,
                pickupLocation,
                {   canInsertBeforeFirst: !this.hasAgentStartLocation(context, agentIndex),
                    canInsertAfterLast: !this.hasAgentEndLocation(context, agentIndex),
                    travelTimes: pickupTravelTimes }
            );

            pickup = pickupIndex;
        }

        const canReuseDeliveryWaypoint =
            deliveryExistingWaypointIndex !== -1 &&
            deliveryExistingWaypointIndex >= pickup;

        // find delivery position
        if (canReuseDeliveryWaypoint) {
            createDeliveryWaypoint = false;
            delivery = deliveryExistingWaypointIndex;
        } else {
            const routeWithPickup = [...routeLocations];
            if (createPickupWaypoint) {
                routeWithPickup.splice(pickup, 0, pickupLocation);
            }

            const deliveryTravelTimes = await this.calculateTravelTimes(context, routeWithPickup.slice(pickup), deliveryLocation, pickupTravelTimes);
            const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeWithPickup.slice(pickup),
                deliveryLocation,
                { canInsertBeforeFirst: false, travelTimes: deliveryTravelTimes }
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

        let pickupTravelTimes;

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

            const routeLocationsAfter = hasDeliveryAfterMin 
                ? allRouteLocations.slice(routeStartIndex, deliveryExistingWaypointIndex + 1) 
                : allRouteLocations.slice(routeStartIndex);

            if (routeLocationsAfter.length === 0) {
                pickup = routeStartIndex;
                pickupRouteIndex = routeStartIndex;
            } else {
                const pickupOptions = hasDeliveryAfterMin
                    ? { canInsertBeforeFirst: false, canInsertAfterLast: false }
                    : { canInsertBeforeFirst: false, canInsertAfterLast: this.hasAgentEndLocation(context, agentIndex)};
                pickupTravelTimes = await this.calculateTravelTimes(context, routeLocationsAfter, pickupLocation);

                pickupIndexRelative = await InsertionCostCalculator.findOptimalInsertionPoint(
                    context,
                    agentIndex,
                    routeLocationsAfter,
                    pickupLocation,
                    { ...pickupOptions, travelTimes: pickupTravelTimes }
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
            delivery = createPickupWaypoint ? deliveryExistingWaypointIndex + 1 : deliveryExistingWaypointIndex;
        } else {
            const routeWithPickup = [...allRouteLocations];
            if (createPickupWaypoint) {
                routeWithPickup.splice(pickupRouteIndex, 0, pickupLocation);
            }

            const deliveryTravelTimes = await this.calculateTravelTimes(context, routeWithPickup.slice(pickupRouteIndex), deliveryLocation, pickupTravelTimes);
            const deliveryIndex = await InsertionCostCalculator.findOptimalInsertionPoint(
                context,
                agentIndex,
                routeWithPickup.slice(pickupRouteIndex),
                deliveryLocation,
                { canInsertBeforeFirst: false, travelTimes: deliveryTravelTimes }
            );

            delivery = createPickupWaypoint ? pickup + deliveryIndex + 1 : pickup + deliveryIndex;
        }

        return {
            pickup,
            delivery,
            createPickupWaypoint,
            createDeliveryWaypoint
        };
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

    private static async calculateTravelTimes(
        context: RouteResultEditorBase,
        route: [number, number][],
        newLocation: [number, number],
        existing?: InsertionTravelTimes
    ): Promise<InsertionTravelTimes> {
        const matrixHelper = context.getMatrixHelper();
        const [timesToNew, timesFromNew] = await Promise.all([
            matrixHelper.calculateTimesToLocation(route, newLocation),
            matrixHelper.calculateTimesFromLocation(newLocation, route)
        ]);

        const travelTimes: InsertionTravelTimes = existing || [];
        for (let i = 0; i < route.length; i++) {
            travelTimes.push({
                locationFrom: route[i],
                locationTo: newLocation,
                time: timesToNew[i]
            });
            travelTimes.push({
                locationFrom: newLocation,
                locationTo: route[i],
                time: timesFromNew[i]
            });
        }

        return travelTimes;
    }
}
