import {ActionResponseData, AddAssignOptions, ViolationError} from "../../../../models";
import { 
    AssignStrategy, 
    RouteEditorHelper,
    RouteTimeCalculator,
    InsertPositionResolver,
    WaypointBuilder
} from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";
import { JobValidationHelper } from "../../validations";

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
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        this.validateJobConstraints(context, agentIndex, jobIndexes);
        
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

    private validateJobConstraints(
        context: RouteResultEditorBase,
        agentIndex: number,
        jobIndexes: number[]
    ): void {
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        
        const existingJobIndexes = context.getAgentJobs(agentIndex);
        const existingJobs = existingJobIndexes.map(i => rawData.properties.params.jobs[i]);
        const newJobs = jobIndexes.map(i => rawData.properties.params.jobs[i]);
        const allJobs = [...existingJobs, ...newJobs];
        
        const violations = JobValidationHelper.validateAll(agent, allJobs, agentIndex);
        this.addViolationsToResult(rawData, violations);
    }

    private addViolationsToResult(rawData: any, violations: ViolationError[]): void {
        if (violations.length === 0) return;
        
        if (!rawData.properties.agentViolations) {
            rawData.properties.agentViolations = {};
        }
        
        violations.forEach(violation => {
            const agentIndex = violation.agentIndex;
            if (!rawData.properties.agentViolations![agentIndex]) {
                rawData.properties.agentViolations![agentIndex] = [];
            }
            rawData.properties.agentViolations![agentIndex].push(violation);
        });
    }

    private async determineInsertPosition(
        context: RouteResultEditorBase,
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

    private getEndPosition(context: RouteResultEditorBase, agentIndex: number): number {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        return context.findEndActionIndex(actions);
    }

    private async findOptimalInsertPosition(
        context: RouteResultEditorBase,
        agentIndex: number, 
        jobIndex: number
    ): Promise<number> {
        const job = RouteEditorHelper.getJobByIndex(context, jobIndex);
        const jobLocation: [number, number] = job.location!;
        const agentFeature = context.getAgentFeature(agentIndex);
        
        if (!agentFeature) {
            return 1; // After start action
        }

        const routeLocations = InsertPositionResolver.extractRouteLocations(agentFeature);
        
        if (routeLocations.length === 0) {
            return 1; // After start action
        }
        
        const matrixHelper = context.getMatrixHelper();
        const optimalIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, jobLocation);
        
        return optimalIndex + 1; // +1 to account for 'start' action
    }

    private insertJobActionsAtPosition(
        context: RouteResultEditorBase,
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

