import { RouteResultEditorBase } from "./route-result-editor-base";
import { Job, JobData } from "../../models";
import { RoutePlanner } from "../../route-planner";
import { Utils } from "../utils";

export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentIndex: number, jobIndexes: number[], newPriority?: number): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateJobs(jobIndexes, agentIndex);
        
        // Set job priorities in the original data (permanent change)
        for (const jobIndex of jobIndexes) {
            this.setJobPriority(jobIndex, newPriority);
        }
        
        // Clone the input data for planning
        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);
        
        // Apply temporary requirements and capabilities for planning
        if(this.result.getRawData().properties.issues?.unassigned_jobs) {
            this.markJobsUnassigned(inputDataCopy.jobs, this.result.getRawData().properties.issues.unassigned_jobs);
        }
        this.markJobsForAgent(inputDataCopy.jobs, jobIndexes, agentIndex);
        this.markRemainingJobsWithAgentRequirement(inputDataCopy.jobs, jobIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);

        return true;
    }

    async removeJobs(jobIndexes: number[]) {
        this.validateJobs(jobIndexes);

        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);
        
        this.markJobsUnassigned(inputDataCopy.jobs, jobIndexes);
        if(this.result.getRawData().properties.issues?.unassigned_jobs) {
            this.markJobsUnassigned(inputDataCopy.jobs, this.result.getRawData().properties.issues.unassigned_jobs);
        }
        this.markRemainingJobsWithAgentRequirement(inputDataCopy.jobs, jobIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);

        return true;
    }

    async addNewJobs(agentIndex: number, jobs: Job[]) {
        let jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewJobs(jobsRaw);
        
        // Add new jobs to the original data (permanent change)
        const initialJobsCount = this.result.getRawData().properties.params.jobs.length;
        this.result.getRawData().properties.params.jobs.push(...jobsRaw);
        
        // Get the indexes of the newly added jobs
        const newJobIndexes = jobsRaw.map((_, index) => initialJobsCount + index);
        
        // Clone the input data for planning
        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);
        
        // Apply temporary requirements and capabilities for planning
        if(this.result.getRawData().properties.issues?.unassigned_jobs) {
            this.markJobsUnassigned(inputDataCopy.jobs, this.result.getRawData().properties.issues.unassigned_jobs);
        }
        this.markJobsForAgent(inputDataCopy.jobs, newJobIndexes, agentIndex);
        this.markRemainingJobsWithAgentRequirement(inputDataCopy.jobs, newJobIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);
        
        return true;
    }

    private markJobsUnassigned(jobs: JobData[], jobIndexes: number[]) {
        jobIndexes.forEach(jobIndex => {
            if (jobs[jobIndex]) {
                if (!jobs[jobIndex].requirements) {
                    jobs[jobIndex].requirements = [];
                }
                if (!jobs[jobIndex].requirements.includes(this.unassignedReq)) {
                    jobs[jobIndex].requirements.push(this.unassignedReq);
                }
            }
        });
    }

    private markRemainingJobsWithAgentRequirement(jobs: JobData[], jobIndexes: number[]) {
        for (let i = 0; i < jobs.length; i++) {
            if (!jobIndexes.includes(i)) {
                // This is a remaining job, find which agent it belongs to
                const jobInfo = this.result.getJobInfoByIndex(i);
                if (jobInfo) {
                    const agentIndex = jobInfo.getAgent().getAgentIndex();
                    const assignAgentReq = `${this.assignAgentReqStart}${agentIndex}`;
                    if (!jobs[i].requirements) {
                        jobs[i].requirements = [];
                    }
                    if(jobs[i].requirements.includes('unassigned')) {
                        jobs[i].requirements.splice(jobs[i].requirements.indexOf('unassigned'), 1);
                    }
                    if (!jobs[i].requirements.includes(assignAgentReq)) {
                        jobs[i].requirements.push(assignAgentReq);
                    }
                }
            }
        }
    }

    private markJobsForAgent(jobs: JobData[], jobIndexes: number[], agentIndex: number) {
        jobIndexes.forEach(jobIndex => {
            if (jobs[jobIndex]) {
                const assignAgentReq = `assign-agent-${agentIndex}`;
                if (!jobs[jobIndex].requirements) {
                    jobs[jobIndex].requirements = [];
                }
                if(jobs[jobIndex].requirements.includes('unassigned')) {
                    jobs[jobIndex].requirements.splice(jobs[jobIndex].requirements.indexOf('unassigned'), 1);
                }
                if (!jobs[jobIndex].requirements.includes(assignAgentReq)) {
                    jobs[jobIndex].requirements.push(assignAgentReq);
                }
            }
        });
    }

    private validateJobs(jobIndexes: number[], agentIndex?: number) {
        if (jobIndexes.length == 0) {
            throw new Error("No jobs provided");
        }
        if (!this.checkIfArrayIsUnique(jobIndexes)) {
            throw new Error("Jobs are not unique");
        }
        jobIndexes.forEach((jobIndex) => {
            let jobInfo = this.result.getJobInfoByIndex(jobIndex);
            if (jobInfo == undefined) {
                this.validateJobExists(jobIndex);
            }
            if(agentIndex != undefined) {
                if (jobInfo?.getAgent().getAgentIndex() == agentIndex) {
                    throw new Error(`Job with index ${jobIndex} already assigned to agent with index ${agentIndex}`);
                }
            }
        });
    }

    private validateJobExists(jobIndex: number) {
        let jobFound = this.getJobByIndex(jobIndex);
        if (!jobFound) {
            throw new Error(`Job with index ${jobIndex} not found`);
        } else {
            let isUnassignedJob = this.result.getRawData().properties.issues.unassigned_jobs.includes(jobIndex);
            if (!isUnassignedJob) {
                throw new Error(`Job with index ${jobIndex} is invalid`);
            }
        }
    }

    private validateNewJobs(jobs: JobData[]) {
        if (jobs.length == 0) {
            throw new Error("No jobs provided");
        }
        if (!this.checkIfArrayIsUnique(jobs)) {
            throw new Error("Jobs are not unique");
        }
    }

    private setJobPriority(jobIndex: number, newPriority?: number) {
        if(newPriority != undefined) {
            this.result.getRawData().properties.params.jobs[jobIndex].priority = newPriority;
        }
    }
}