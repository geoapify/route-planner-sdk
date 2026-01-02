import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    RouteEditorHelper, 
    RouteTimeCalculator,
    InsertPositionResolver
} from "../base";

/**
 * Strategy that inserts jobs at optimal or specified position
 */
export class JobInsertStrategy implements AssignStrategy {

    async execute(
        context: StrategyContext,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        RouteEditorHelper.removeJobsFromAgents(context, jobIndexes);
        
        const agentFeature = context.getAgentFeature(agentIndex);
        const insertPosition = await this.determineInsertPosition(context, agentIndex, jobIndexes[0], options);
        const actions = agentFeature.properties.actions;
        
        this.insertJobActionsAtPosition(context, actions, jobIndexes, insertPosition);
        context.reindexActions(actions);
        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getJobActionLocation
        );
        
        return true;
    }

    private async determineInsertPosition(context: StrategyContext, agentIndex: number, firstJobIndex: number, options: AddAssignOptions): Promise<number> {
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            return InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
        }
        return await this.findOptimalInsertPosition(context, agentIndex, firstJobIndex);
    }

    private async findOptimalInsertPosition(context: StrategyContext, agentIndex: number, jobIndex: number): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation: [number, number] = job.location!;
        const agentSolution = context.getResult().getAgentSolutionByIndex(agentIndex);
        
        if (!agentSolution) {
            return 0;
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentSolution);
        const matrixHelper = context.createMatrixHelper();
        const optimalIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, jobLocation);
        
        return optimalIndex + 1;
    }

    private insertJobActionsAtPosition(context: StrategyContext, actions: any[], jobIndexes: number[], insertPosition: number): void {
        for (let i = 0; i < jobIndexes.length; i++) {
            const newAction = RouteEditorHelper.createJobAction(context, jobIndexes[i], insertPosition + i);
            actions.splice(insertPosition + i, 0, newAction);
        }
    }
}
