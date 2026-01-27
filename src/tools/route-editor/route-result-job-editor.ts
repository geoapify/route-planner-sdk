import {
    Job,
    JobData,
    AddAssignOptions,
    RemoveOptions,
    REOPTIMIZE,
    ItemAlreadyAssigned, JobNotFound
} from "../../models";
import { JobStrategyFactory } from "./strategies";
import { RouteResultEditorBase } from "./route-result-editor-base";

/**
 * Editor for managing jobs in a route planner result
 */
export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentIndex: number, jobIndexes: number[], options: AddAssignOptions = {}): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateJobs(jobIndexes, agentIndex);
        this.applyPriority(jobIndexes, options.priority);
        
        const strategy = JobStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, agentIndex, jobIndexes, options);
    }

    async removeJobs(jobIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateJobs(jobIndexes);
        
        const strategy = JobStrategyFactory.createRemoveStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, jobIndexes, options);
    }

    async addNewJobs(agentIndex: number, jobs: Job[], options: AddAssignOptions = {}): Promise<boolean> {
        const jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentIndex);
        this.ensureNewItemsValid(jobsRaw, "jobs");
        
        const newJobIndexes = this.appendJobsToInput(jobsRaw);
        
        const strategy = JobStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, agentIndex, newJobIndexes, options);
    }

    private validateJobs(jobIndexes: number[], agentIndex?: number): void {
        this.ensureItemsProvided(jobIndexes, "jobs");
        this.ensureItemsUnique(jobIndexes, "jobs");
        
        for (const jobIndex of jobIndexes) {
            this.validateJobAssignment(jobIndex, agentIndex);
        }
    }

    private validateJobAssignment(jobIndex: number, agentIndex?: number): void {
        const jobAgentIndex = this.getAgentIndexForJob(jobIndex);
        if (jobAgentIndex != undefined) {
            this.validateJobExists(jobIndex);
        }
        if (agentIndex !== undefined && jobAgentIndex === agentIndex) {
            throw new ItemAlreadyAssigned(
                `Job with index ${jobIndex} already assigned to agent with index ${agentIndex}`,
                'job',
                jobIndex,
                agentIndex
            );
        }
    }

    private validateJobExists(jobIndex: number): void {
        const jobFound = this.rawData.properties.params.jobs[jobIndex];
        if (!jobFound) {
            throw new JobNotFound(`Job with index ${jobIndex} not found`, jobIndex);
        }
    }

    private appendJobsToInput(jobsRaw: JobData[]): number[] {
        const params = this.rawData.properties.params;
        if (!params.jobs) {
            params.jobs = [];
        }
        const startIndex = params.jobs.length;
        params.jobs.push(...jobsRaw);
        return jobsRaw.map((_, i) => startIndex + i);
    }

    private applyPriority(jobIndexes: number[], priority?: number): void {
        if (priority === undefined) return;
        for (const jobIndex of jobIndexes) {
            this.rawData.properties.params.jobs[jobIndex].priority = priority;
        }
    }
}
