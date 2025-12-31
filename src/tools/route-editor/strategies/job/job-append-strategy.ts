import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    ActionFactory, 
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
        const agentFeature = context.getAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        
        for (const jobIndex of jobIndexes) {
            const newAction = ActionFactory.createJobAction(context, jobIndex, endActionIndex);
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
