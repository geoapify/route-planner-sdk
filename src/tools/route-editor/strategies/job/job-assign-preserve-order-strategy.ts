import {AddAssignOptions, PRESERVE_ORDER, REOPTIMIZE, RemoveOptions} from "../../../../models";
import { 
    AssignStrategy, 
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {RouteTimeRecalculator, WaypointBuilder} from "../preserve-order";
import {PreserveOrderJobHelper} from "../preserve-order/helpers/preserve-order-job-helper";
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
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        const insertPosition = await PreserveOrderJobHelper.determineInsertPosition(context, agentIndex, jobIndexes[0], options);
        
        PreserveOrderJobHelper.insertJobActionsAtPosition(context, actions, jobIndexes, insertPosition);
        context.reindexActions(actions);
        
        for (let i = 0; i < jobIndexes.length; i++) {
            WaypointBuilder.insertJobWaypoint(context, agentIndex, jobIndexes[i], insertPosition + i);
        }
        
        await RouteTimeRecalculator.recalculate(context, agentIndex);
        
        RouteViolationValidator.validate(context, agentIndex);
        
        this.removeFromUnassignedJobs(context, jobIndexes);
        
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

    private removeFromUnassignedJobs(context: RouteResultEditorBase, jobIndexes: number[]): void {
        const rawData = context.getRawData();
        const issues = rawData.properties.issues;
        if (!issues?.unassigned_jobs) {
            return;
        }

        issues.unassigned_jobs = issues.unassigned_jobs
            .filter((jobIndex: number) => !jobIndexes.includes(jobIndex));
    }
}

