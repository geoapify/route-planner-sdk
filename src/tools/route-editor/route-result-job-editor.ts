import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, Job, JobData, RouteActionInfo } from "../../models";

export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentIndex: number, jobIndexes: number[]): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateJobs(jobIndexes, agentIndex);
        for (const jobIndex of jobIndexes) {
            await this.assignJob(jobIndex, agentIndex);
        }
        return true;
    }

    async removeJobs(jobIndexes: number[]) {
        this.validateJobs(jobIndexes);
        for (const jobIndex of jobIndexes) {
            await this.removeJob(jobIndex);
        }
        return true;
    }

    async addNewJobs(agentIndex: number, jobs: Job[]) {
        let jobsRaw = jobs.map(job => job.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewJobs(jobsRaw);
        await this.addNewJobsToAgent(agentIndex, jobsRaw);
        return true;
    }

    private async assignJob(jobIndex: number, agentIndex: number) {
        let jobInfo = this.result.getJobInfoByIndex(jobIndex);
        let newAgentSolution = this.result.getAgentSolutionByIndex(agentIndex)!;
        if (newAgentSolution && jobInfo) {
            await this.addJobToExistingAgent(agentIndex, jobIndex);
            await this.removeJobFromExistingAgent(jobInfo, jobIndex);
        }
        if (newAgentSolution && !jobInfo) {
            await this.addJobToExistingAgent(agentIndex, jobIndex);
        }
        if(!newAgentSolution && jobInfo) {
            await this.removeJobFromExistingAgent(jobInfo, jobIndex);
            await this.addJobToNonExistingAgent(agentIndex, jobIndex);
        }
        if(!newAgentSolution && !jobInfo) {
            await this.addJobToNonExistingAgent(agentIndex, jobIndex);
        }
    }

    private async removeJob(jobIndex: number) {
        let jobInfo = this.result.getJobInfoByIndex(jobIndex);
        if (jobInfo) {
            await this.removeJobFromExistingAgent(jobInfo, jobIndex);
        } else {
            this.result.getRawData().properties.issues.unassigned_jobs =
                this.result.getRawData().properties.issues.unassigned_jobs.filter((nextJobIndex) => nextJobIndex !== jobIndex);
        }
    }

    private async addNewJobsToAgent(agentIndex: number, jobs: JobData[]) {
        let existingAgentSolution = this.result.getAgentSolutionByIndex(agentIndex);
        let initialJobsCount = this.result.getRawData().properties.params.jobs.length;
        this.result.getRawData().properties.params.jobs.push(...jobs);
        let newAgentInput = this.addJobsToAgent(agentIndex, jobs.map((job, index) => initialJobsCount + index), existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async addJobToNonExistingAgent(agentIndex: number, jobIndex: number) {
        let newAgentInput = this.addJobsToAgent(agentIndex, [jobIndex]);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async addJobToExistingAgent(agentIndex: number, jobIndex: number) {
        let existingAgentSolution = this.result.getAgentSolutionByIndex(agentIndex)!;
        let newAgentInput = this.addJobsToAgent(agentIndex, [jobIndex], existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async removeJobFromExistingAgent(jobInfo: RouteActionInfo, initialJobIndex: number) {
        let existingAgentSolution = jobInfo.getAgent();
        let newAgentInput = this.removeJobFromAgent(existingAgentSolution, jobInfo.getActions()[0].getJobIndex()!);
        this.addUnassignedJob(initialJobIndex);
        if(newAgentInput.agentShipmentIndexes.size == 0 && newAgentInput.agentJobIndexes.size == 0) {
            this.removeAgent(existingAgentSolution.getAgentIndex());
        } else {
            let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
            this.updateAgent(optimizedRouterPlan, existingAgentSolution.getAgentIndex());
        }
    }

    private addJobsToAgent(agentIndex: number, jobIndexes: number[], existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentIndex, existingAgent);
        jobIndexes.forEach(jobIndex => {
            optimizedAgentInput.agentJobIndexes.add(jobIndex);
        })
        return optimizedAgentInput;
    }

    private removeJobFromAgent(existingAgent: AgentSolution, jobIndex: number): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentIndex(), existingAgent);
        optimizedAgentInput.agentJobIndexes.delete(jobIndex);
        return optimizedAgentInput;
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
            if(agentIndex) {
                if (jobInfo?.getAgent().getAgentIndex() == agentIndex) {
                    throw new Error(`Job with index ${jobIndex} already assigned to agent with index ${agentIndex}`);
                }
            }
        });
    }

    private validateJobExists(jobIndex: number) {
        let jobFound = this.getJobByIndex(jobIndex);
        if (!jobFound) {
            throw new Error(`Job with index ${jobFound} not found`);
        } else {
            let isUnassignedJob = this.result.getRawData().properties.issues.unassigned_jobs.includes(jobIndex);
            if (!isUnassignedJob) {
                throw new Error(`Job with id ${jobFound} not found`);
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

    private addUnassignedJob(initialJobIndex: number) {
        this.generateEmptyUnassignedJobsIfNeeded();
        this.result.getRawData().properties.issues.unassigned_jobs.push(initialJobIndex);
    }
}