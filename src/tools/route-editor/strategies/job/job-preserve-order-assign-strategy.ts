import {ActionResponseData, AddAssignOptions} from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    RouteEditorHelper, 
    RouteTimeCalculator,
    InsertPositionResolver,
    WaypointBuilder
} from "../base";

/**
 * Strategy that inserts jobs while preserving the order of existing stops.
 * 
 * Behavior:
 * - appendToEnd: true → Appends to end of route (no API call)
 * - beforeId/afterId/insertAtIndex → Inserts at specified position (no API call)
 * - No position params → Uses Route Matrix API to find optimal insertion point
 */
export class JobPreserveOrderAssignStrategy implements AssignStrategy {

    async execute(
        context: StrategyContext,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        RouteEditorHelper.removeJobsFromAgents(context, jobIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        const insertPosition = await this.determineInsertPosition(context, agentIndex, jobIndexes[0], options);
        
        this.insertJobActionsAtPosition(context, actions, jobIndexes, insertPosition);
        context.reindexActions(actions);
        
        // Create waypoints for the added jobs
        for (let i = 0; i < jobIndexes.length; i++) {
            WaypointBuilder.insertJobWaypoint(context, agentIndex, jobIndexes[i], insertPosition + i);
        }
        
        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getJobActionLocation
        );
        
        return true;
    }

    private async determineInsertPosition(
        context: StrategyContext, 
        agentIndex: number, 
        firstJobIndex: number, 
        options: AddAssignOptions
    ): Promise<number> {
        // appendToEnd: true → Append to end
        if (InsertPositionResolver.shouldAppendToEnd(options)) {
            return this.getEndPosition(context, agentIndex);
        }
        
        // beforeId/afterId/insertAtIndex → Insert at specified position
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            return InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
        }
        
        // No position params → Use Route Matrix API to find optimal position
        return await this.findOptimalInsertPosition(context, agentIndex, firstJobIndex);
    }

    private getEndPosition(context: StrategyContext, agentIndex: number): number {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        return context.findEndActionIndex(actions);
    }

    private async findOptimalInsertPosition(
        context: StrategyContext, 
        agentIndex: number, 
        jobIndex: number
    ): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation: [number, number] = job.location!;
        const agentSolution = context.getResult().getAgentSolutionByIndex(agentIndex);
        
        if (!agentSolution) {
            return 1; // After start action
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentSolution);
        
        if (routeLocations.length === 0) {
            return 1; // After start action
        }
        
        const matrixHelper = context.createMatrixHelper();
        const optimalIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, jobLocation);
        
        return optimalIndex + 1; // +1 to account for 'start' action
    }

    private insertJobActionsAtPosition(
        context: StrategyContext, 
        actions: ActionResponseData[],
        jobIndexes: number[], 
        insertPosition: number
    ): void {
        for (let i = 0; i < jobIndexes.length; i++) {
            const newAction = RouteEditorHelper.createJobAction(context, jobIndexes[i], insertPosition + i);
            actions.splice(insertPosition + i, 0, newAction);
        }
    }
}

