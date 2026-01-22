import { AddAssignOptions } from "../../../../models";
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
        const agentPlan = context.getResult().getAgentPlanByIndex(agentIndex);
        return agentPlan ? agentPlan.getActions().length : 0;
    }

    static validateAndGetWaypointIndex(
        context: StrategyContext, 
        agentIndex: number, 
        waypointIndex: number
    ): number {
        const agentPlan = context.getResult().getAgentPlanByIndex(agentIndex);
        
        // Agent has no Plan yet (newly created or unassigned)
        if (!agentPlan) {
            throw new Error(`Agent with index ${agentIndex} has no existing route. Cannot use waypoint indexes on agents without routes. Use appendToEnd: true instead.`);
        }
        
        const waypoints = agentPlan.getWaypoints();
        
        // Validate range
        if (waypointIndex < 0) {
            throw new Error(`Waypoint index ${waypointIndex} cannot be negative`);
        }
        if (waypointIndex >= waypoints.length) {
            throw new Error(`Waypoint index ${waypointIndex} is out of range (agent has ${waypoints.length} waypoints)`);
        }
        
        // Convert waypoint index to action index
        // Each waypoint can have multiple actions
        let actionIndex = 0;
        for (let i = 0; i < waypointIndex; i++) {
            actionIndex += waypoints[i].getActions().length;
        }
        
        return actionIndex;
    }

    static validateBeforeWaypointIndex(waypointIndex: number): void {
        if (waypointIndex === 0) {
            throw new Error(`Cannot insert before waypoint 0 (start location). Use afterWaypointIndex: 0 to insert at the beginning.`);
        }
    }

    static validateAfterWaypointIndex(context: StrategyContext, agentIndex: number, waypointIndex: number): void {
        const agentPlan = context.getResult().getAgentPlanByIndex(agentIndex);
        if (agentPlan) {
            const waypoints = agentPlan.getWaypoints();
            const lastWaypointIndex = waypoints.length - 1;
            if (waypointIndex === lastWaypointIndex) {
                throw new Error(`Cannot insert after waypoint ${waypointIndex} (end location). Use appendToEnd: true instead.`);
            }
        }
    }

    static findActionPositionById(context: StrategyContext, agentIndex: number, actionId: string): number {
        const agentPlan = context.getResult().getAgentPlanByIndex(agentIndex);
        if (!agentPlan) {
            throw new Error(`Agent with index ${agentIndex} has no Plan`);
        }
        
        const actions = agentPlan.getActions();
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const id = action.getJobId() || action.getShipmentId();
            if (id === actionId) {
                return i;
            }
        }
        throw new Error(`Action with id ${actionId} not found in agent's route`);
    }

    static extractRouteLocations(agentPlan: any): [number, number][] {
        const waypoints = agentPlan.getWaypoints();
        return waypoints
            .filter((wp: any) => this.isActionWaypoint(wp))
            .map((wp: any) => [wp.getLocation()[0], wp.getLocation()[1]] as [number, number]);
    }

    static isActionWaypoint(waypoint: any): boolean {
        return waypoint.getActions().some((a: any) => 
            a.getType() !== 'start' && a.getType() !== 'end'
        );
    }
}

