import {AddAssignOptions, FeatureResponseData, RoutePlannerResultData} from "../../../../models";
import { StrategyContext } from "./strategy-context";

/**
 * Shared helper for resolving insert positions
 */
export class InsertPositionResolver {

    static hasExplicitInsertPosition(options: AddAssignOptions): boolean {
        return (options.beforeId !== undefined && options.beforeId !== '') || 
               (options.afterId !== undefined && options.afterId !== '') || 
               options.beforeWaypointIndex !== undefined ||
               options.afterWaypointIndex !== undefined ||
               options.appendToEnd === true;
    }

    static shouldAppendToEnd(options: AddAssignOptions): boolean {
        return options.appendToEnd === true;
    }

    static resolveInsertPosition(context: StrategyContext, agentIndex: number, options: AddAssignOptions): number {
        if (options.beforeId && options.beforeId !== '') {
            return this.findActionPositionById(context, agentIndex, options.beforeId);
        }
        if (options.afterId && options.afterId !== '') {
            return this.findActionPositionById(context, agentIndex, options.afterId) + 1;
        }
        if (options.beforeWaypointIndex !== undefined) {
            this.validateBeforeWaypointIndex(options.beforeWaypointIndex);
            return this.validateAndGetWaypointIndex(context, agentIndex, options.beforeWaypointIndex);
        }
        if (options.afterWaypointIndex !== undefined) {
            this.validateAfterWaypointIndex(context, agentIndex, options.afterWaypointIndex);
            return this.validateAndGetWaypointIndex(context, agentIndex, options.afterWaypointIndex) + 1;
        }
        const agentActions = context.getAgentActions(agentIndex);
        return agentActions ? agentActions.length : 0;
    }

    static validateAndGetWaypointIndex(
        context: StrategyContext,
        agentIndex: number,
        waypointIndex: number
    ): number {
        const waypoints = context.getAgentWaypoints(agentIndex);

        if (waypoints.length === 0) {
            throw new Error(`Agent ${agentIndex} has no route. Use appendToEnd: true for agents without routes.`
            );
        }

        if (waypointIndex < 0 || waypointIndex >= waypoints.length) {
            throw new Error(`Waypoint index ${waypointIndex} out of range (0-${waypoints.length - 1})`
            );
        }

        let actionIndex = 0;
        for (let i = 0; i < waypointIndex; i++) {
            actionIndex += waypoints[i].actions.length;
        }

        return actionIndex;
    }

    static validateBeforeWaypointIndex(waypointIndex: number): void {
        if (waypointIndex === 0) {
            throw new Error(`Cannot insert before waypoint 0 (start location). Use afterWaypointIndex: 0 to insert at the beginning.`);
        }
    }

    static validateAfterWaypointIndex(context: StrategyContext, agentIndex: number, waypointIndex: number): void {
        const waypoints = context.getAgentWaypoints(agentIndex);
        const lastWaypointIndex = waypoints.length - 1;

        if (waypointIndex === lastWaypointIndex) {
            throw new Error(
                `Cannot insert after waypoint ${waypointIndex} (end location). Use appendToEnd: true instead.`
            );
        }
    }

    static findActionPositionById(context: StrategyContext, agentIndex: number, actionId: string): number {
        const actions = context.getAgentActions(agentIndex);

        for (let i = 0; i < actions.length; i++) {
            const id = actions[i].job_id || actions[i].shipment_id;
            if (id === actionId) {
                return i;
            }
        }

        throw new Error(`Action '${actionId}' not found in agent ${agentIndex} route`);
    }

    static extractRouteLocations(agentFeature: FeatureResponseData): [number, number][] {
        return agentFeature.properties.waypoints
            .filter(waypoint => this.isActionWaypoint(waypoint))
            .map(waypoint => waypoint.location);
    }

    static isActionWaypoint(waypoint: any): boolean {
        return waypoint.getActions().some((a: any) => 
            a.getType() !== 'start' && a.getType() !== 'end'
        );
    }
}

