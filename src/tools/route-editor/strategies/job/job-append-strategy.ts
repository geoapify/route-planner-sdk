import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    RouteEditorHelper, 
    RouteTimeCalculator 
} from "../base";

/**
 * Strategy that appends jobs to the end of agent's route without reoptimization
 */
export class JobAppendStrategy implements AssignStrategy {

    async execute(
        context: StrategyContext,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        RouteEditorHelper.removeJobsFromAgents(context, jobIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        
        for (const jobIndex of jobIndexes) {
            const newAction = RouteEditorHelper.createJobAction(context, jobIndex, endActionIndex);
            actions.splice(endActionIndex, 0, newAction);
            context.reindexActions(actions);
        }

        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getJobActionLocation
        );
        return true;
    }
}
