import { RemoveOptions} from "../../../../models";
import { RemoveStrategy as IRemoveStrategy } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";
import { AgentPlanRecalculator, WaypointBuilder } from "../preserve-order";
import { RouteViolationValidator } from "../../validations";

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
            await AgentPlanRecalculator.recalculate(context, agentIndex, );
            RouteViolationValidator.validate(context, agentIndex);
        }

        return true;
    }

    private removeJobFromResult(context: RouteResultEditorBase, jobIndex: number): number {
        const agentIndex = context.getAgentIndexForJob(jobIndex);
        if (agentIndex === undefined) {
            return -1;
        }

        const feature = context.getAgentFeature(agentIndex);
        const waypoints = feature.properties.waypoints;
        const legs = feature.properties.legs || [];

        const legDataMap = WaypointBuilder.buildLegDataMap(waypoints, legs);

        WaypointBuilder.removeJobsFromWaypoints(waypoints, jobIndex);
        const cleanupResult = WaypointBuilder.removeEmptyWaypoints(waypoints, legDataMap);
        feature.properties.waypoints = cleanupResult.waypoints;
        if (cleanupResult.legs) {
            feature.properties.legs = cleanupResult.legs;
        }
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
