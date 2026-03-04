import {AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions} from "../../../../models";
import { 
    AssignStrategy, 
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {AgentPlanRecalculator, WaypointBuilder} from "../preserve-order";
import {JobInsertPosition, PreserveOrderJobHelper} from "../preserve-order/helpers/preserve-order-job-helper";
import {RouteViolationValidator} from "../preserve-order/validations";
import {JobRemovePreserveOrderStrategy} from "./job-remove-preserve-order-strategy";
import {JobRemoveReoptimizeStrategy} from "./job-remove-reoptimize-strategy";

/**
 * Strategy that inserts jobs while preserving the order of existing stops.
 * 
 * Behavior:
 * - append: true → Appends to end of route (no API call)
 * - afterId/insertAtIndex → Inserts at specified position (no API call)
 * - No position params → Uses Route Matrix API to find optimal insertion point
 */
export class JobAssignPreserveOrderStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        await this.removeJobsFromCurrentAgents(context, jobIndexes, options);
                
        for (let i = 0; i < jobIndexes.length; i++) {
            const insertPosition: JobInsertPosition =
                await PreserveOrderJobHelper.determineInsertPosition(context, agentIndex, jobIndexes[i], options);
            WaypointBuilder.insertJobWaypoint(context, agentIndex, jobIndexes[i], insertPosition);
        }
        
        await AgentPlanRecalculator.recalculate(context, agentIndex);
        
        RouteViolationValidator.validate(context, agentIndex);
                
        return true;
    }

    private async removeJobsFromCurrentAgents(context: RouteResultEditorBase, jobIndexes: number[],
                                              options: AddAssignOptions): Promise<void> {
        const removeStrategyType = options.removeStrategy ?? PRESERVE_ORDER;
        const removeStrategy = removeStrategyType === REOPTIMIZE 
            ? new JobRemoveReoptimizeStrategy() 
            : new JobRemovePreserveOrderStrategy();
        const removeOptions: RemoveOptions = { strategy: removeStrategyType };
        await removeStrategy.execute(context, jobIndexes, removeOptions);
    }
}
