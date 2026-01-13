import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, StrategyContext } from "../base";

/**
 * Strategy that removes jobs while preserving the order of remaining jobs
 */
export class JobPreserveOrderStrategy implements IRemoveStrategy {

    async execute(
        context: StrategyContext,
        jobIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        for (const jobIndex of jobIndexes) {
            this.removeJobFromResult(context, jobIndex);
        }
        return true;
    }

    private removeJobFromResult(context: StrategyContext, jobIndex: number): void {
        const rawData = context.getRawData();
        
        for (const feature of rawData.features) {
            const actions = feature.properties.actions;
            const jobActionIndex = actions.findIndex((a: any) => a.job_index === jobIndex);
            
            if (jobActionIndex !== -1) {
                actions.splice(jobActionIndex, 1);
                context.reindexActions(actions);
                this.addToUnassignedJobs(context, jobIndex);
                break;
            }
        }
    }

    private addToUnassignedJobs(context: StrategyContext, jobIndex: number): void {
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

