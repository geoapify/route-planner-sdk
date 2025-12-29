import { RouteResultEditorBase } from "./route-result-editor-base";
import { Job, JobData, AddAssignOptions, RemoveOptions } from "../../models";

export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentIndex: number, jobIndexes: number[], options: AddAssignOptions = {}): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateJobs(jobIndexes, agentIndex);
        this.applyPriority(jobIndexes, options.priority);
        
        return this.replanWithJobsAssignedToAgent(agentIndex, jobIndexes);
    }

    async removeJobs(jobIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateJobs(jobIndexes);
        return this.replanWithJobsUnassigned(jobIndexes);
    }

    async addNewJobs(agentIndex: number, jobs: Job[], options: AddAssignOptions = {}): Promise<boolean> {
        const jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewJobs(jobsRaw);
        
        const newJobIndexes = this.appendJobsToInput(jobsRaw);
        return this.replanWithJobsAssignedToAgent(agentIndex, newJobIndexes);
    }

    private async replanWithJobsAssignedToAgent(agentIndex: number, jobIndexes: number[]): Promise<boolean> {
        const inputData = this.cloneInputData();
        
        this.markExistingUnassignedJobs(inputData.jobs);
        this.markJobsForAgent(inputData.jobs, jobIndexes, agentIndex);
        this.markRemainingJobsWithAgentRequirement(inputData.jobs, jobIndexes);
        this.addAgentCapabilities(inputData.agents);

        return this.executePlan(inputData);
    }

    private async replanWithJobsUnassigned(jobIndexes: number[]): Promise<boolean> {
        const inputData = this.cloneInputData();
        
        this.markJobsUnassigned(inputData.jobs, jobIndexes);
        this.markExistingUnassignedJobs(inputData.jobs);
        this.markRemainingJobsWithAgentRequirement(inputData.jobs, jobIndexes);
        this.addAgentCapabilities(inputData.agents);

        return this.executePlan(inputData);
    }

    private appendJobsToInput(jobsRaw: JobData[]): number[] {
        const startIndex = this.result.getRawData().properties.params.jobs.length;
        this.result.getRawData().properties.params.jobs.push(...jobsRaw);
        return jobsRaw.map((_, i) => startIndex + i);
    }

    private applyPriority(jobIndexes: number[], priority?: number) {
        if (priority === undefined) return;
        for (const jobIndex of jobIndexes) {
            this.result.getRawData().properties.params.jobs[jobIndex].priority = priority;
        }
    }

    private markExistingUnassignedJobs(jobs: JobData[]) {
        const unassignedJobs = this.result.getRawData().properties.issues?.unassigned_jobs;
        if (unassignedJobs) {
            this.markJobsUnassigned(jobs, unassignedJobs);
        }
    }

    private markJobsUnassigned(jobs: JobData[], jobIndexes: number[]) {
        for (const jobIndex of jobIndexes) {
            if (!jobs[jobIndex]) continue;
            if (!jobs[jobIndex].requirements) {
                jobs[jobIndex].requirements = [];
            }
            if (!jobs[jobIndex].requirements.includes(this.unassignedReq)) {
                jobs[jobIndex].requirements.push(this.unassignedReq);
            }
        }
    }

    private markRemainingJobsWithAgentRequirement(jobs: JobData[], excludeIndexes: number[]) {
        for (let i = 0; i < jobs.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const jobInfo = this.result.getJobInfoByIndex(i);
            if (!jobInfo) continue;
            
            const agentIndex = jobInfo.getAgent().getAgentIndex();
            const assignAgentReq = `${this.assignAgentReqStart}${agentIndex}`;
            
            if (!jobs[i].requirements) {
                jobs[i].requirements = [];
            }
            this.removeRequirement(jobs[i].requirements, this.unassignedReq);
            this.addRequirement(jobs[i].requirements, assignAgentReq);
        }
    }

    private markJobsForAgent(jobs: JobData[], jobIndexes: number[], agentIndex: number) {
        const assignAgentReq = `assign-agent-${agentIndex}`;
        for (const jobIndex of jobIndexes) {
            if (!jobs[jobIndex]) continue;
            if (!jobs[jobIndex].requirements) {
                jobs[jobIndex].requirements = [];
            }
            this.removeRequirement(jobs[jobIndex].requirements, this.unassignedReq);
            this.addRequirement(jobs[jobIndex].requirements, assignAgentReq);
        }
    }

    private validateJobs(jobIndexes: number[], agentIndex?: number) {
        if (jobIndexes.length === 0) {
            throw new Error("No jobs provided");
        }
        if (!this.checkIfArrayIsUnique(jobIndexes)) {
            throw new Error("Jobs are not unique");
        }
        for (const jobIndex of jobIndexes) {
            const jobInfo = this.result.getJobInfoByIndex(jobIndex);
            if (!jobInfo) {
                this.validateJobExists(jobIndex);
            }
            if (agentIndex !== undefined && jobInfo?.getAgent().getAgentIndex() === agentIndex) {
                throw new Error(`Job with index ${jobIndex} already assigned to agent with index ${agentIndex}`);
            }
        }
    }

    private validateJobExists(jobIndex: number) {
        const jobFound = this.getJobByIndex(jobIndex);
        if (!jobFound) {
            throw new Error(`Job with index ${jobIndex} not found`);
        }
        const isUnassignedJob = this.result.getRawData().properties.issues?.unassigned_jobs?.includes(jobIndex);
        if (!isUnassignedJob) {
            throw new Error(`Job with index ${jobIndex} is invalid`);
        }
    }

    private validateNewJobs(jobs: JobData[]) {
        if (jobs.length === 0) {
            throw new Error("No jobs provided");
        }
        if (!this.checkIfArrayIsUnique(jobs)) {
            throw new Error("Jobs are not unique");
        }
    }
}
