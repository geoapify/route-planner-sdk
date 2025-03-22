import { RoutePlannerResult } from "./models/entities/route-planner-result";
import {
    AgentSolution,
    RouteActionInfo,
    RoutePlannerInputData,
} from "./models";
import { Utils } from "./tools/utils";
import { RoutePlanner } from "./route-planner";

export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = result;
    }

    public getRoutePlannerResult(): RoutePlannerResult {
        return this.result;
    }

    /**
     * Assigns a job to an agent. Removes the job if it's currently assigned to another agent
     * @param agentId - The ID of the agent.
     * @param jobIds
     * @returns {boolean} - Returns true if the job was successfully assigned.
     */
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

    private generateOptimizeAgentInput(agentId: string, existingAgent?: AgentSolution): OptimizeAgentInput {
        if(!existingAgent) {
            return new OptimizeAgentInput(agentId, [], [], []);
        }
        let agentJobs = existingAgent.getActions()
            .filter(action => action.getJobId() !== undefined)
            .map(action => action.getJobId()!);
        let agentShipments = existingAgent.getActions()
            .filter(action => action.getShipmentId() !== undefined)
            .map(action => action.getShipmentId()!);
        let agentLocations = existingAgent.getActions()
            .filter(action => action.getLocationId() !== undefined)
            .map(action => action.getLocationId()!);
        return new OptimizeAgentInput(existingAgent.getAgentId(), agentJobs, agentShipments, agentLocations);
    }

    async optimizeRoute(optimizeAgentInput: OptimizeAgentInput): Promise<RoutePlannerResult> {
        let newRawData: RoutePlannerInputData = Utils.cloneObject(this.result.getRaw().inputData);

        newRawData.agents = newRawData.agents.filter(nextAgent => nextAgent.id == optimizeAgentInput.agentId);
        newRawData.jobs = newRawData.jobs.filter(nextJob => optimizeAgentInput.agentJobIds.has(nextJob.id!));
        newRawData.shipments = newRawData.shipments.filter(nextShipment => optimizeAgentInput.agentShipmentIds.has(nextShipment.id!));
        newRawData.locations = newRawData.locations.filter(nextLocation => optimizeAgentInput.agentLocationIds.has(nextLocation.id!));

        const planner = new RoutePlanner(this.result.getOptions(), newRawData);
        return await planner.plan();
    }

    updateAgent(newResult: RoutePlannerResult) {
        let agentId = newResult.getRaw().inputData.agents[0].id!;
        if (newResult.getUnassignedAgents().length > 0) {
            let agentIndex = this.getInitialAgentIndex(agentId);
            if (!this.result.getUnassignedAgents().includes(agentIndex)) {
                this.result.getRaw().agents = this.result.getRaw().agents.filter(agent => agent.agentId != agentId);
            }
            this.updateUnassignedItems(newResult);
        } else {
            let existingAgentSolution = this.result.getAgentSolution(agentId);
            if (existingAgentSolution) {
                this.result.getRaw().agents = this.result.getRaw().agents.filter(agent => agent.agentId != agentId);
            }
            this.result.getRaw().agents.push(newResult.getRaw().agents[0]);
            this.updateUnassignedItems(newResult);
        }
    }

    updateUnassignedItems(newResult: RoutePlannerResult) {
        this.updateUnassignedAgents(newResult);
        this.updateUnassignedJobs(newResult);
        this.updateUnassignedShipments(newResult);
    }

    private updateUnassignedAgents(newResult: RoutePlannerResult) {
        let agentId = newResult.getRaw().inputData.agents[0].id!;
        let agentIndex = this.getInitialAgentIndex(agentId);
        if (newResult.getUnassignedAgents().length > 0) {
            if (!this.result.getUnassignedAgents().includes(agentIndex)) {
                if(!this.result.getRaw().unassignedAgents) {
                  this.result.getRaw().unassignedAgents = [];
                }
                this.result.getRaw().unassignedAgents.push(agentIndex);
            }
        } else {
            if(!this.result.getRaw().unassignedAgents) {
              this.result.getRaw().unassignedAgents = [];
            }
            this.result.getRaw().unassignedAgents =
                this.result.getRaw().unassignedAgents.filter(unassignedAgentIndex => unassignedAgentIndex != agentIndex);
        }
    }

    private updateUnassignedJobs(newResult: RoutePlannerResult) {
        let unassignedJobs = this.getUnassignedJobs(newResult);
        unassignedJobs.forEach(jobId => {
            let initialJobIndex = this.getInitialJobIndex(jobId);
            if (!this.result.getUnassignedJobs().includes(initialJobIndex)) {
                if(!this.result.getRaw().unassignedJobs) {
                  this.result.getRaw().unassignedJobs = [];
                }
                this.result.getRaw().unassignedJobs.push(initialJobIndex);
            }
        });
        let assignedJobs = newResult.getRaw().agents[0].actions.filter(action => action.job_id).map(action => action.job_id!);
        assignedJobs.forEach(jobId => {
            let initialJobIndex = this.getInitialJobIndex(jobId);
            if (this.result.getUnassignedJobs().includes(initialJobIndex)) {
                if(!this.result.getRaw().unassignedJobs) {
                  this.result.getRaw().unassignedJobs = [];
                }
                this.result.getRaw().unassignedJobs =
                    this.result.getRaw().unassignedJobs.filter(unassignedJobIndex => unassignedJobIndex != initialJobIndex);
            }
        });
    }

    private updateUnassignedShipments(newResult: RoutePlannerResult) {
        let unassignedShipments = this.getUnassignedShipments(newResult);
        unassignedShipments.forEach(shipmentId => {
            let initialShipmentIndex = this.getInitialShipmentIndex(shipmentId);
            if (!this.result.getUnassignedShipments().includes(initialShipmentIndex)) {
                if(!this.result.getRaw().unassignedShipments) {
                  this.result.getRaw().unassignedShipments = [];
                }
                this.result.getRaw().unassignedShipments.push(initialShipmentIndex);
            }
        });
        let assignedShipments = newResult.getRaw().agents[0].actions.filter(action => action.shipment_id).map(action => action.shipment_id!);
        assignedShipments.forEach(shipmentId => {
            let initialShipmentIndex = this.getInitialShipmentIndex(shipmentId);
            if (this.result.getUnassignedShipments().includes(initialShipmentIndex)) {
                if(!this.result.getRaw().unassignedShipments) {
                  this.result.getRaw().unassignedShipments = [];
                }
                this.result.getRaw().unassignedShipments =
                    this.result.getRaw().unassignedShipments.filter(unassignedShipmentIndex => unassignedShipmentIndex != initialShipmentIndex);
            }
        });
    }

    getUnassignedShipments(result: RoutePlannerResult): string[] {
        return result.getUnassignedShipments().map((jobIndex) => {
            return this.result.getRaw().inputData.shipments[jobIndex].id!;
        });
    }

    getUnassignedJobs(result: RoutePlannerResult): string[] {
        return result.getUnassignedJobs().map((jobIndex) => {
            return this.result.getRaw().inputData.jobs[jobIndex].id!;
        });
    }

    validateAgent(agentId: string) {
        let agentIndex = this.getInitialAgentIndex(agentId);
        if (agentIndex == -1) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
    }

    validateJobs(agentId: string, jobIds: string[]) {
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

    getInitialAgentIndex(agentId: string): number {
        return this.result.getRaw().inputData.agents.findIndex(item => item.id == agentId);
    }

    getInitialJobIndex(jobId: string): number {
        return this.result.getRaw().inputData.jobs.findIndex(item => item.id == jobId);
    }

    getInitialShipmentIndex(shipmentId: string): number {
        return this.result.getRaw().inputData.shipments.findIndex(item => item.id == shipmentId);
    }

    checkIfArrayIsUnique(myArray: any[]) {
        return myArray.length === new Set(myArray).size;
    }
}

class OptimizeAgentInput {
    agentJobIds: Set<string>;
    agentShipmentIds: Set<string>;
    agentLocationIds: Set<string>;
    agentId: string;

    constructor(agentId: string, agentJobIds: string[], agentShipmentIds: string[], agentLocationIds: string[]) {
        this.agentId = agentId;
        this.agentJobIds = new Set(agentJobIds);
        this.agentShipmentIds = new Set(agentShipmentIds);
        this.agentLocationIds = new Set(agentLocationIds);
    }
}