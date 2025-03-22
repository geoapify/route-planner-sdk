import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, RouteActionInfo } from "../../models";

export class RouteResultJobEditor extends RouteResultEditorBase {

    async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
        this.validateAgent(agentId);
        this.validateJobs(agentId, jobIds);
        for (const jobId of jobIds) {
            await this.assignJob(jobId, agentId);
        }
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

    private async addJobToNonExistingAgent(agentId: string, jobId: string) {
        let newAgentInput = this.addJobToAgent(agentId, jobId);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addJobToExistingAgent(agentId: string, jobId: string) {
        let existingAgentSolution = this.result.getAgentSolution(agentId)!;
        let newAgentInput = this.addJobToAgent(agentId, jobId, existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async removeJobFromExistingAgent(jobInfo: RouteActionInfo) {
        let existingAgentSolution = jobInfo.getAgent();
        let newAgentInput = this.removeJobFromAgent(existingAgentSolution, jobInfo.getAction().getJobId()!);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private addJobToAgent(agentId: string, jobId: string, existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentId, existingAgent);
        optimizedAgentInput.agentJobIds.add(jobId);
        return optimizedAgentInput;
    }

    private removeJobFromAgent(existingAgent: AgentSolution, jobId: string): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentId(), existingAgent);
        optimizedAgentInput.agentJobIds.delete(jobId);
        return optimizedAgentInput;
    }

    private validateJobs(agentId: string, jobIds: string[]) {
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
            if (jobInfo?.getAgentId() == agentId) {
                throw new Error(`Job with id ${jobId} already assigned to agent ${agentId}`);
            }
        });
    }

    private validateJobExists(jobId: string) {
        let jobIndex = this.getInitialJobIndex(jobId);
        if (jobIndex == -1) {
            throw new Error(`Job with id ${jobId} not found`);
        } else {
            let isUnassignedJob = this.result.getUnassignedJobs().includes(jobIndex);
            if (!isUnassignedJob) {
                throw new Error(`Job with id ${jobId} not found`);
            }
        }
    }
}