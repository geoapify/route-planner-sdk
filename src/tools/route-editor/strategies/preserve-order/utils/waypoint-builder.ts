import { RouteEditorHelper } from "./route-editor-helper";
import { LegRecalculator, MISSING_LEG_DATA } from "./leg-recalculator";
import {ActionResponseData, LegResponseData, WaypointResponseData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {ShipmentInsertPositions} from "../helpers/preserve-order-shipment-helper";
import { JobInsertPosition } from "../helpers/preserve-order-job-helper";

/**
 * Builds/updates agent waypoints for preserveOrder edits, without calling the routing API.
 * Keeps `waypoints[*].actions[*].waypoint_index` and `actions[*].waypoint_index` consistent.
 * Also manages legs when inserting waypoints.
 */
export class WaypointBuilder {

    static insertJobWaypoint(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndex: number,
        position: JobInsertPosition
    ): void {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);    
        const jobLocationData = RouteEditorHelper.resolveJobWaypointLocationData(context, job);
        
        const action = RouteEditorHelper.createJobAction(context, jobIndex, position.position); 

        if (position.createWaypoint) {

            const newWaypoint: WaypointResponseData = {
                original_location: jobLocationData.location,
                original_location_index: jobLocationData.locationIndex,
                original_location_id: jobLocationData.locationId,
                start_time: action.start_time || 0,
                duration: action.duration || 0,
                actions: [action],
                prev_leg_index: undefined,
                next_leg_index: undefined
            };

            waypoints.splice(position.position, 0, newWaypoint);
            LegRecalculator.replaceLegsForInsertedWaypoint(context, agentIndex, position.position);
        } else {
            this.addActionToWaypoint(waypoints[position.position], action);
        }
    }

    /**
     * Creates and inserts waypoints for a shipment (pickup and delivery).
     */
    static insertShipmentWaypoints(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number,
        positions: ShipmentInsertPositions
    ): void {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);

        const pickupAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'pickup', positions.pickup);
        const deliveryAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'delivery', positions.delivery);    

        if (positions.createPickupWaypoint) {
            const pickupLocationData = RouteEditorHelper.resolveShipmentStepWaypointLocationData(context, shipment.pickup!);
            const pickupWaypoint: WaypointResponseData = {
                original_location: pickupLocationData.location,
                original_location_index: pickupLocationData.locationIndex,
                original_location_id: pickupLocationData.locationId,
                start_time: pickupAction.start_time || 0,
                duration: pickupAction.duration || 0,
                actions: [{ ...pickupAction, waypoint_index: positions.pickup }],
                prev_leg_index: undefined,
                next_leg_index: undefined
            };
            waypoints.splice(positions.pickup, 0, pickupWaypoint);
            LegRecalculator.replaceLegsForInsertedWaypoint(context, agentIndex, positions.pickup);
        } else {
            const existingPickupWaypoint = waypoints[positions.pickup];
            if (existingPickupWaypoint) {
                this.addActionToWaypoint(existingPickupWaypoint, pickupAction);
            }
        }

        if (positions.createDeliveryWaypoint) {
            const deliveryLocationData = RouteEditorHelper.resolveShipmentStepWaypointLocationData(context, shipment.delivery!);
            const deliveryWaypoint: WaypointResponseData = {
                original_location: deliveryLocationData.location,
                original_location_index: deliveryLocationData.locationIndex,
                original_location_id: deliveryLocationData.locationId,
                start_time: deliveryAction.start_time || 0,
                duration: deliveryAction.duration || 0,
                actions: [{ ...deliveryAction, waypoint_index: positions.delivery }],
                prev_leg_index: undefined,
                next_leg_index: undefined
            };
            waypoints.splice(positions.delivery, 0, deliveryWaypoint);
            LegRecalculator.replaceLegsForInsertedWaypoint(context, agentIndex, positions.delivery);
        } else {
            const existingDeliveryWaypoint = waypoints[positions.delivery];
            if (existingDeliveryWaypoint) {
                this.addActionToWaypoint(existingDeliveryWaypoint, deliveryAction);
            }
        }
    }

    private static addActionToWaypoint(waypoint: WaypointResponseData, action: ActionResponseData): void {
        const endActionIndex = waypoint.actions.findIndex(existingAction => existingAction.type === "end");
        if (endActionIndex >= 0) {
            waypoint.actions.splice(endActionIndex, 0, { ...action });
            return;
        }

        waypoint.actions.push({ ...action });
    }

    static actionsMatch(a: ActionResponseData, b: ActionResponseData): boolean {
        if (a.type !== b.type) return false;
        if (a.type === 'job') return a.job_index === b.job_index;
        if (a.type === 'pickup' || a.type === 'delivery') return a.shipment_index === b.shipment_index;
        if (a.type === 'start' || a.type === 'end') return true;
        return false;
    }

    static removeJobActionFromWaypoints(waypoints: WaypointResponseData[], jobIndex: number): void {
        for (const waypoint of waypoints) {
            waypoint.actions = waypoint.actions.filter(a => a.job_index !== jobIndex);
        }
    }

    static removeShipmentActionsFromWaypoints(waypoints: WaypointResponseData[], shipmentIndex: number): void {
        for (const waypoint of waypoints) {
            waypoint.actions = waypoint.actions.filter(a => a.shipment_index !== shipmentIndex);
        }
    }

    static removeEmptyWaypoints(
        waypoints: WaypointResponseData[],
        legDataMap?: Map<string, LegResponseData>
    ): { waypoints: WaypointResponseData[]; legs?: LegResponseData[]; removedWaypointIndices: number[] } {
        const updatedWaypoints: WaypointResponseData[] = [];
        const removedWaypointIndices: number[] = [];

        for (let i = 0; i < waypoints.length; i++) {
            if (waypoints[i].actions.length > 0) {
                updatedWaypoints.push(waypoints[i]);
            } else {
                removedWaypointIndices.push(i);
            }
        }

        if (!legDataMap || removedWaypointIndices.length === 0) {
            return { waypoints: updatedWaypoints, removedWaypointIndices };
        }

        return {
            waypoints: updatedWaypoints,
            legs: this.rebuildLegs(updatedWaypoints, legDataMap),
            removedWaypointIndices
        };
    }

    static buildLegDataMap(waypoints: WaypointResponseData[],
                           legs: LegResponseData[]): Map<string, LegResponseData> {
        const result = new Map<string, LegResponseData>();

        for (const leg of legs) {
            const fromWaypoint = waypoints[leg.from_waypoint_index];
            const toWaypoint = waypoints[leg.to_waypoint_index];
            if (!fromWaypoint || !toWaypoint) {
                continue;
            }

            const key = this.getLocationPairKey(
                this.getWaypointLocation(fromWaypoint),
                this.getWaypointLocation(toWaypoint)
            );
            result.set(key, leg);
        }

        return result;
    }

    static rebuildLegs(waypoints: WaypointResponseData[],
                       legDataMap: Map<string, LegResponseData>): LegResponseData[] {
        const legs: LegResponseData[] = [];

        for (let i = 0; i < waypoints.length - 1; i++) {
            const fromWaypoint = waypoints[i];
            const toWaypoint = waypoints[i + 1];
            const key = this.getLocationPairKey(
                this.getWaypointLocation(fromWaypoint),
                this.getWaypointLocation(toWaypoint)
            );
            const existingLeg = legDataMap.get(key);

            if (existingLeg) {
                legs.push({
                    from_waypoint_index: i,
                    to_waypoint_index: i + 1,
                    time: existingLeg.time,
                    distance: existingLeg.distance,
                    steps: existingLeg.steps || []
                });
            } else {
                legs.push({
                    from_waypoint_index: i,
                    to_waypoint_index: i + 1,
                    time: MISSING_LEG_DATA,
                    distance: MISSING_LEG_DATA,
                    steps: []
                });
            }
        }

        return legs;
    }

    static getLocationPairKey(from: [number, number], to: [number, number]): string {
        return `${from[0]},${from[1]}->${to[0]},${to[1]}`;
    }

    private static getWaypointLocation(waypoint: WaypointResponseData): [number, number] {
        return waypoint.location || waypoint.original_location;
    }
}
