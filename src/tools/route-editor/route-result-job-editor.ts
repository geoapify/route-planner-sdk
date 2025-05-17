import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, Job, JobData, RouteActionInfo } from "../../models";

export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
        this.validateAgent(agentId);
        this.validateJobs(jobIds, agentId);
        for (const jobId of jobIds) {
            await this.assignJob(jobId, agentId);
        }
        return true;
    }

    async removeJobs(jobIds: string[]) {
        this.validateJobs(jobIds);
        for (const jobId of jobIds) {
            await this.removeJob(jobId);
        }
        return true;
    }

    async addNewJobs(agentId: string, jobs: Job[]) {
        let jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentId);
        this.validateNewJobs(jobsRaw);
        await this.addNewJobsToAgent(agentId, jobsRaw);
        return true;
    }

    private async assignJob(jobId: string, agentId: string) {
        let jobInfo = this.result.getJobInfo(jobId);
        let newAgentSolution = this.result.getAgentSolution(agentId)!;
        if (newAgentSolution && jobInfo) {
            await this.addJobToExistingAgent(agentId, jobId);
            await this.removeJobFromExistingAgent(jobInfo);
        }
        if (newAgentSolution && !jobInfo) {
            await this.addJobToExistingAgent(agentId, jobId);
        }
        if(!newAgentSolution && jobInfo) {
            await this.addJobToNonExistingAgent(agentId, jobId);
            await this.removeJobFromExistingAgent(jobInfo);
        }
        if(!newAgentSolution && !jobInfo) {
            await this.addJobToNonExistingAgent(agentId, jobId);
        }
    }

    private async removeJob(jobId: string) {
        let jobInfo = this.result.getJobInfo(jobId);
        if (jobInfo) {
            await this.removeJobFromExistingAgent(jobInfo);
        } else {
            let jobInitialIndex = this.getInitialJobIndex(jobId);
            this.result.getRawData().properties.issues.unassigned_jobs =
                this.result.getRawData().properties.issues.unassigned_jobs.filter((jobIndex) => jobIndex !== jobInitialIndex);
        }
    }

    private async addNewJobsToAgent(agentId: string, jobs: JobData[]) {
        let existingAgentSolution = this.result.getAgentSolution(agentId);
        this.result.getRawData().properties.params.jobs.push(...jobs);
        let newAgentInput = this.addJobsToAgent(agentId, jobs.map((job) => job.id!), existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addJobToNonExistingAgent(agentId: string, jobId: string) {
        let newAgentInput = this.addJobsToAgent(agentId, [jobId]);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addJobToExistingAgent(agentId: string, jobId: string) {
        let existingAgentSolution = this.result.getAgentSolution(agentId)!;
        let newAgentInput = this.addJobsToAgent(agentId, [jobId], existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async removeJobFromExistingAgent(jobInfo: RouteActionInfo) {
        let existingAgentSolution = jobInfo.getAgent();
        let newAgentInput = this.removeJobFromAgent(existingAgentSolution, jobInfo.getActions()[0].getJobId()!);
        if(newAgentInput.agentShipmentIds.size == 0 && newAgentInput.agentJobIds.size == 0) {
            this.removeAgent(existingAgentSolution.getAgentId());
        } else {
            let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
            this.updateAgent(optimizedRouterPlan);
        }
    }

    private addJobsToAgent(agentId: string, jobIds: string[], existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentId, existingAgent);
        jobIds.forEach(jobId => {
            optimizedAgentInput.agentJobIds.add(jobId);
        })
        return optimizedAgentInput;
    }

    private removeJobFromAgent(existingAgent: AgentSolution, jobId: string): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentId(), existingAgent);
        optimizedAgentInput.agentJobIds.delete(jobId);
        return optimizedAgentInput;
    }

    private validateJobs(jobIds: string[], agentId?: string) {
        if (jobIds.length == 0) {
            throw new Error("No jobs provided");
        }
        if (!this.checkIfArrayIsUnique(jobIds)) {
            throw new Error("Jobs are not unique");
        }
        jobIds.forEach((jobId) => {
            let jobInfo = this.result.getJobInfo(jobId);
            if (jobInfo == undefined) {
                this.validateJobExists(jobId);
            }
            if(agentId) {
                if (jobInfo?.getAgentId() == agentId) {
                    throw new Error(`Job with id ${jobId} already assigned to agent ${agentId}`);
                }
            }
        });
    }

    private validateJobExists(jobId: string) {
        let jobIndex = this.getInitialJobIndex(jobId);
        if (jobIndex == -1) {
            throw new Error(`Job with id ${jobId} not found`);
        } else {
            let isUnassignedJob = this.result.getRawData().properties.issues.unassigned_jobs.includes(jobIndex);
            if (!isUnassignedJob) {
                throw new Error(`Job with id ${jobId} not found`);
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
        jobs.forEach((job) => {
            if(job.id == undefined) {
                throw new Error("Job id is undefined");
            }
        });
    }
}