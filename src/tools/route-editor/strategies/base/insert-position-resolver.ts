import { AddAssignOptions } from "../../../../models";
import { StrategyContext } from "./strategy-context";

/**
 * Shared helper for resolving insert positions
 */
export class InsertPositionResolver {

    static hasExplicitInsertPosition(options: AddAssignOptions): boolean {
        return options.beforeId !== undefined || 
               options.afterId !== undefined || 
               options.insertAtIndex !== undefined;
    }

    static resolveInsertPosition(context: StrategyContext, agentIndex: number, options: AddAssignOptions): number {
        if (options.beforeId !== undefined) {
            return this.findActionPositionById(context, agentIndex, options.beforeId);
        }
        if (options.afterId !== undefined) {
            return this.findActionPositionById(context, agentIndex, options.afterId) + 1;
        }
        if (options.insertAtIndex !== undefined) {
            // Offset by 1 to account for 'start' action at position 0
            // insertAtIndex: 0 means "first job/shipment position" which is after 'start'
            return options.insertAtIndex + 1;
        }
        const agentSolution = context.getResult().getAgentSolutionByIndex(agentIndex);
        return agentSolution ? agentSolution.getActions().length : 0;
    }

    static findActionPositionById(context: StrategyContext, agentIndex: number, actionId: string): number {
        const agentSolution = context.getResult().getAgentSolutionByIndex(agentIndex);
        if (!agentSolution) {
            throw new Error(`Agent with index ${agentIndex} has no solution`);
        }
        
        const actions = agentSolution.getActions();
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const id = action.getJobId() || action.getShipmentId();
            if (id === actionId) {
                return i;
            }
        }
        throw new Error(`Action with id ${actionId} not found in agent's route`);
    }

    static extractRouteLocations(agentSolution: any): [number, number][] {
        const waypoints = agentSolution.getWaypoints();
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

