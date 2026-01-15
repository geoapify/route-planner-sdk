import { StrategyContext } from "./strategy-context";
import { RouteEditorHelper } from "./route-editor-helper";
import {ActionResponseData, WaypointResponseData} from "../../../../models";

/**
 * Builds/updates agent waypoints for preserveOrder edits, without calling the routing API.
 * Keeps `waypoints[*].actions[*].waypoint_index` and `actions[*].waypoint_index` consistent.
 */
export class WaypointBuilder {

    static insertJobWaypoint(
        context: StrategyContext,
        agentIndex: number,
        jobIndex: number,
        actionIndex: number
    ): void {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const actions = agentFeature.properties.actions;
        
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const action = actions.find((a: ActionResponseData) => a.job_index === jobIndex);
        
        if (!action || !job.location) {
            return;
        }

        // Find the waypoint index where we should insert
        const waypointIndex = this.findWaypointIndexForAction(waypoints, actionIndex);
        
        // Create the new waypoint
        const newWaypoint = {
            original_location: job.location,
            location: job.location,
            start_time: action.start_time || 0,
            duration: action.duration || 0,
            actions: [{ ...action, waypoint_index: waypointIndex }],
            prev_leg_index: waypointIndex > 0 ? waypointIndex - 1 : undefined,
            next_leg_index: waypointIndex < waypoints.length ? waypointIndex : undefined
        };

        // Insert the waypoint
        waypoints.splice(waypointIndex, 0, newWaypoint);

        // Update waypoint_index in all actions and waypoints
        this.reindexWaypoints(waypoints, actions);
    }

    /**
     * Creates and inserts waypoints for a shipment (pickup and delivery).
     */
    static insertShipmentWaypoints(
        context: StrategyContext,
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

        // Insert pickup waypoint first
        const pickupLocation = shipment.pickup?.location;
        if (pickupLocation) {
            const pickupWaypointIndex = this.findWaypointIndexForAction(waypoints, pickupActionIndex);
            const pickupWaypoint = {
                original_location: pickupLocation,
                location: pickupLocation,
                start_time: pickupAction.start_time || 0,
                duration: pickupAction.duration || 0,
                actions: [{ ...pickupAction, waypoint_index: pickupWaypointIndex }],
                prev_leg_index: pickupWaypointIndex > 0 ? pickupWaypointIndex - 1 : undefined,
                next_leg_index: pickupWaypointIndex
            };
            waypoints.splice(pickupWaypointIndex, 0, pickupWaypoint);
        }

        // Insert delivery waypoint (note: waypoints array has grown by 1)
        const deliveryLocation = shipment.delivery?.location;
        if (deliveryLocation) {
            const deliveryWaypointIndex = this.findWaypointIndexForAction(waypoints, deliveryActionIndex);
            const deliveryWaypoint = {
                original_location: deliveryLocation,
                location: deliveryLocation,
                start_time: deliveryAction.start_time || 0,
                duration: deliveryAction.duration || 0,
                actions: [{ ...deliveryAction, waypoint_index: deliveryWaypointIndex }],
                prev_leg_index: deliveryWaypointIndex > 0 ? deliveryWaypointIndex - 1 : undefined,
                next_leg_index: deliveryWaypointIndex < waypoints.length - 1 ? deliveryWaypointIndex : undefined
            };
            waypoints.splice(deliveryWaypointIndex, 0, deliveryWaypoint);
        }

        // Update waypoint_index in all actions and waypoints
        this.reindexWaypoints(waypoints, actions);
    }

    /**
     * Find the waypoint index where a new waypoint should be inserted
     * based on the action index.
     */
    private static findWaypointIndexForAction(waypoints: WaypointResponseData[], actionIndex: number): number {
        // Count actions before the target action index to find corresponding waypoint
        let cumulativeActions = 0;
        for (let i = 0; i < waypoints.length; i++) {
            const waypointActions = waypoints[i].actions || [];
            cumulativeActions += waypointActions.length;
            if (cumulativeActions >= actionIndex) {
                return i + 1; // Insert after this waypoint
            }
        }
        return waypoints.length;
    }

    /**
     * Reindex waypoint_index in all actions and update waypoint references.
     */
    private static reindexWaypoints(waypoints: WaypointResponseData[], actions: ActionResponseData[]): void {
        // Update waypoint_index in each waypoint's actions
        for (let wpIndex = 0; wpIndex < waypoints.length; wpIndex++) {
            const waypoint = waypoints[wpIndex];
            if (waypoint.actions) {
                for (const action of waypoint.actions) {
                    action.waypoint_index = wpIndex;
                }
            }
            // Update leg indices
            waypoint.prev_leg_index = wpIndex > 0 ? wpIndex - 1 : undefined;
            waypoint.next_leg_index = wpIndex < waypoints.length - 1 ? wpIndex : undefined;
        }

        // Update waypoint_index in the main actions array to match
        for (const action of actions) {
            const waypointIndex = this.findWaypointIndexForActionInWaypoints(waypoints, action);
            if (waypointIndex !== -1) {
                action.waypoint_index = waypointIndex;
            }
        }
    }

    /**
     * Find which waypoint contains a given action.
     */
    private static findWaypointIndexForActionInWaypoints(waypoints: WaypointResponseData[], targetAction: ActionResponseData): number {
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

    /**
     * Check if two actions refer to the same job/shipment.
     */
    private static actionsMatch(a: ActionResponseData, b: ActionResponseData): boolean {
        if (a.type !== b.type) return false;
        if (a.type === 'job') return a.job_index === b.job_index;
        if (a.type === 'pickup' || a.type === 'delivery') return a.shipment_index === b.shipment_index;
        if (a.type === 'start' || a.type === 'end') return true;
        return false;
    }
}
