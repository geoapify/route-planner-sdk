import {ActionResponseData, RemoveOptions} from "../../../../models";
import { RemoveStrategy as IRemoveStrategy } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";
import { RouteTimeRecalculator, WaypointBuilder } from "../preserve-order";

/**
 * Strategy that removes jobs while preserving the order of remaining jobs.
 * Also removes waypoints and rebuilds legs.
 */
export class JobRemovePreserveOrderStrategy implements IRemoveStrategy {

    async execute(
        context: RouteResultEditorBase,
        jobIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const impactedAgentIndexes = new Set<number>();

        for (const jobIndex of jobIndexes) {
            const agentIndex = this.removeJobFromResult(context, jobIndex);
            if (agentIndex !== -1) {
                impactedAgentIndexes.add(agentIndex);
            }
        }

        for (const agentIndex of impactedAgentIndexes) {
            await RouteTimeRecalculator.recalculate(context, agentIndex);
        }

        return true;
    }

    private removeJobFromResult(context: RouteResultEditorBase, jobIndex: number): number {
        const agentIndex = context.getAgentIndexForJob(jobIndex);
        if (agentIndex === undefined) {
            return -1;
        }

        const feature = context.getAgentFeature(agentIndex);
        const actions = feature.properties.actions;
        const waypoints = feature.properties.waypoints;
        const legs = feature.properties.legs || [];

        const legDataMap = WaypointBuilder.buildLegDataMap(waypoints, legs);

        const jobActionIndex = actions.findIndex((action: ActionResponseData) => action.job_index === jobIndex);
        actions.splice(jobActionIndex, 1);
        context.reindexActions(actions);

        WaypointBuilder.removeJobActionFromWaypoints(waypoints, jobIndex);
        const updatedWaypoints = WaypointBuilder.removeEmptyWaypoints(waypoints);
        feature.properties.waypoints = updatedWaypoints;

        WaypointBuilder.reindexWaypointsActions(updatedWaypoints, actions);
        feature.properties.legs = WaypointBuilder.rebuildLegs(updatedWaypoints, legDataMap);
        WaypointBuilder.updateWaypointLegIndices(updatedWaypoints);

        this.addToUnassignedJobs(context, jobIndex);
        return agentIndex;
    }

    private addToUnassignedJobs(context: RouteResultEditorBase, jobIndex: number): void {
        const rawData = context.getRawData();
        if (!rawData.properties.issues) {
            rawData.properties.issues = {};
        }
        const issues = rawData.properties.issues;
        if (!issues.unassigned_jobs) {
            issues.unassigned_jobs = [];
        }
        if (!issues.unassigned_jobs.includes(jobIndex)) {
            issues.unassigned_jobs.push(jobIndex);
        }
    }
}
