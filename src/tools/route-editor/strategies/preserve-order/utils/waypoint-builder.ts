import { RouteEditorHelper } from "./route-editor-helper";
import { LegBuilder } from "./leg-builder";
import {ActionResponseData, WaypointResponseData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";

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
        actionIndex: number
    ): void {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const actions = agentFeature.properties.actions;
        
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const action = actions.find((a: ActionResponseData) => a.job_index === jobIndex);
        
        if (!action) {
            return;
        }

        const jobLocation = RouteEditorHelper.resolveJobLocation(context, job);

        const waypointIndex = this.findWaypointIndexForAction(waypoints, actionIndex);
        
        const newWaypoint: WaypointResponseData = {
            original_location: jobLocation,
            location: jobLocation,
            start_time: action.start_time || 0,
            duration: action.duration || 0,
            actions: [{ ...action, waypoint_index: waypointIndex }],
            prev_leg_index: undefined,
            next_leg_index: undefined
        };

        waypoints.splice(waypointIndex, 0, newWaypoint);
        this.createAndAssignLegs(context, agentIndex, waypointIndex, newWaypoint);
        this.reindexWaypointsActions(waypoints, actions);
    }

    /**
     * Creates and inserts waypoints for a shipment (pickup and delivery).
     */
    static insertShipmentWaypoints(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndex: number,
        pickupActionIndex: number,
        deliveryActionIndex: number
    ): void {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const actions = agentFeature.properties.actions;
        
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        
        const pickupAction = actions.find((a: ActionResponseData) =>
            a.shipment_index === shipmentIndex && a.type === 'pickup'
        );
        const deliveryAction = actions.find((a: ActionResponseData) =>
            a.shipment_index === shipmentIndex && a.type === 'delivery'
        );

        if (!pickupAction || !deliveryAction) {
            return;
        }

        const pickupLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.pickup!);
        const pickupWaypointIndex = this.findWaypointIndexForAction(waypoints, pickupActionIndex);
        const pickupWaypoint: WaypointResponseData = {
            original_location: pickupLocation,
            location: pickupLocation,
            start_time: pickupAction.start_time || 0,
            duration: pickupAction.duration || 0,
            actions: [{ ...pickupAction, waypoint_index: pickupWaypointIndex }],
            prev_leg_index: undefined,
            next_leg_index: undefined
        };
        waypoints.splice(pickupWaypointIndex, 0, pickupWaypoint);

        const deliveryLocation = RouteEditorHelper.resolveShipmentStepLocation(context, shipment.delivery!);
        const deliveryWaypointIndex = this.findWaypointIndexForAction(waypoints, deliveryActionIndex);
        const deliveryWaypoint: WaypointResponseData = {
            original_location: deliveryLocation,
            location: deliveryLocation,
            start_time: deliveryAction.start_time || 0,
            duration: deliveryAction.duration || 0,
            actions: [{ ...deliveryAction, waypoint_index: deliveryWaypointIndex }],
            prev_leg_index: undefined,
            next_leg_index: undefined
        };
        waypoints.splice(deliveryWaypointIndex, 0, deliveryWaypoint);

        this.createAndAssignLegs(context, agentIndex, pickupWaypointIndex, pickupWaypoint);
        this.createAndAssignLegs(context, agentIndex, deliveryWaypointIndex, deliveryWaypoint);
        
        this.reindexWaypointsActions(waypoints, actions);
    }

    private static findWaypointIndexForAction(waypoints: WaypointResponseData[], actionIndex: number): number {
        let cumulativeActions = 0;
        for (let i = 0; i < waypoints.length; i++) {
            const waypointActions = waypoints[i].actions || [];
            cumulativeActions += waypointActions.length;
            if (cumulativeActions >= actionIndex) {
                return i + 1;
            }
        }
        return waypoints.length;
    }

    static reindexWaypointsActions(waypoints: WaypointResponseData[], actions: ActionResponseData[]): void {
        for (let wpIndex = 0; wpIndex < waypoints.length; wpIndex++) {
            const waypoint = waypoints[wpIndex];
            if (waypoint.actions) {
                for (const action of waypoint.actions) {
                    action.waypoint_index = wpIndex;
                }
            }
        }

        for (const action of actions) {
            const waypointIndex = this.findWaypointIndexForActionInWaypoints(waypoints, action);
            if (waypointIndex !== -1) {
                action.waypoint_index = waypointIndex;
            }
        }
    }

    static findWaypointIndexForActionInWaypoints(waypoints: WaypointResponseData[], targetAction: ActionResponseData): number {
        for (let i = 0; i < waypoints.length; i++) {
            const waypoint = waypoints[i];
            if (waypoint.actions) {
                for (const action of waypoint.actions) {
                    if (this.actionsMatch(action, targetAction)) {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    static actionsMatch(a: ActionResponseData, b: ActionResponseData): boolean {
        if (a.type !== b.type) return false;
        if (a.type === 'job') return a.job_index === b.job_index;
        if (a.type === 'pickup' || a.type === 'delivery') return a.shipment_index === b.shipment_index;
        if (a.type === 'start' || a.type === 'end') return true;
        return false;
    }

    private static createAndAssignLegs(context: RouteResultEditorBase, agentIndex: number,
                                       waypointIndex: number, waypoint: WaypointResponseData): void {
        const legIndices = LegBuilder.insertPlaceholderLeg(context, agentIndex, waypointIndex);
        waypoint.prev_leg_index = legIndices.prevLegIndex;
        waypoint.next_leg_index = legIndices.nextLegIndex;
    }
}
