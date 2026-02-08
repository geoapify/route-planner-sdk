import {AddAssignOptions} from "../../../../models";
import { 
    AssignStrategy, 
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import {RouteEditorHelper, RouteTimeRecalculator, WaypointBuilder} from "../preserve-order";
import {PreserveOrderJobHelper} from "../preserve-order/helpers/preserve-order-job-helper";
import {RouteViolationValidator} from "../preserve-order/validations";

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
        RouteEditorHelper.removeJobsFromAgents(context, jobIndexes);
        
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
        
        return true;
    }
}

