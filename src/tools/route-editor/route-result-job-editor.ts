import { Job, JobData, AddAssignOptions, RemoveOptions, REOPTIMIZE, ValidationErrors } from "../../models";
import { JobStrategyFactory } from "./strategies";
import { RouteResultEditorBase } from "./route-result-editor-base";
import { JobValidationHelper } from "./validations";

/**
 * Editor for managing jobs in a route planner result
 */
export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentIndex: number, jobIndexes: number[], options: AddAssignOptions = {}): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateJobs(jobIndexes, agentIndex);
        this.validateJobConstraints(agentIndex, jobIndexes, options);
        this.applyPriority(jobIndexes, options.priority);
        
        const strategy = JobStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this.context, agentIndex, jobIndexes, options);
    }

    async removeJobs(jobIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateJobs(jobIndexes);
        
        const strategy = JobStrategyFactory.createRemoveStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this.context, jobIndexes, options);
    }

    async addNewJobs(agentIndex: number, jobs: Job[], options: AddAssignOptions = {}): Promise<boolean> {
        const jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentIndex);
        this.ensureNewItemsValid(jobsRaw, "jobs");
        this.validateNewJobConstraints(agentIndex, jobsRaw, options);
        
        const newJobIndexes = this.appendJobsToInput(jobsRaw);
        
        const strategy = JobStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this.context, agentIndex, newJobIndexes, options);
    }

    private validateJobs(jobIndexes: number[], agentIndex?: number): void {
        this.ensureItemsProvided(jobIndexes, "jobs");
        this.ensureItemsUnique(jobIndexes, "jobs");
        
        for (const jobIndex of jobIndexes) {
            this.validateJobAssignment(jobIndex, agentIndex);
        }
    }

    private validateJobAssignment(jobIndex: number, agentIndex?: number): void {
        const jobInfo = this.result.getJobInfoByIndex(jobIndex);
        if (!jobInfo) {
            this.validateJobExists(jobIndex);
        }
        if (agentIndex !== undefined && jobInfo?.getAgent().getAgentIndex() === agentIndex) {
            throw new Error(`Job with index ${jobIndex} already assigned to agent with index ${agentIndex}`);
        }
    }

    private validateJobExists(jobIndex: number): void {
        const jobFound = this.result.getRawData().properties.params.jobs[jobIndex];
        if (!jobFound) {
            throw new Error(`Job with index ${jobIndex} not found`);
        }
        const isUnassignedJob = this.result.getRawData().properties.issues?.unassigned_jobs?.includes(jobIndex);
        if (!isUnassignedJob) {
            throw new Error(`Job with index ${jobIndex} is invalid`);
        }
    }

    private validateJobConstraints(agentIndex: number, jobIndexes: number[], options: AddAssignOptions): void {
        const agent = this.getAgentData(agentIndex);
        const existingJobIndexes = this.result.getAgentJobs(agentIndex);
        const existingJobs = existingJobIndexes.map(i => this.getJobData(i));
        const newJobs = jobIndexes.map(i => this.getJobData(i));
        const allJobs = [...existingJobs, ...newJobs];
        
        const issues = JobValidationHelper.validateAll(agent, allJobs);
        this.handleValidationIssues(issues, options);
    }

    private validateNewJobConstraints(agentIndex: number, jobsRaw: JobData[], options: AddAssignOptions): void {
        const agent = this.getAgentData(agentIndex);
        const existingJobIndexes = this.result.getAgentJobs(agentIndex);
        const existingJobs = existingJobIndexes.map(i => this.getJobData(i));
        const allJobs = [...existingJobs, ...jobsRaw];
        
        const issues = JobValidationHelper.validateAll(agent, allJobs);
        this.handleValidationIssues(issues, options);
    }

    private handleValidationIssues(issues: Error[], options: AddAssignOptions): void {
        if (issues.length === 0) return;
        
        const allowViolations = options.allowViolations ?? true;
        
        if (allowViolations) {
            this.addIssuesToResult(issues);
        } else {
            throw new ValidationErrors(issues);
        }
    }

    private addIssuesToResult(issues: Error[]): void {
        if (issues.length === 0) return;
        
        const rawData = this.result.getRawData();
        if (!rawData.properties.violations) {
            rawData.properties.violations = [];
        }
        
        issues.forEach(issue => {
            rawData.properties.violations!.push(issue.message);
        });
    }

    private getAgentData(agentIndex: number) {
        return this.result.getRawData().properties.params.agents[agentIndex];
    }

    private getJobData(jobIndex: number): JobData {
        return this.result.getRawData().properties.params.jobs[jobIndex];
    }

    private appendJobsToInput(jobsRaw: JobData[]): number[] {
        const params = this.result.getRawData().properties.params;
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
            this.result.getRawData().properties.params.jobs[jobIndex].priority = priority;
        }
    }
}
