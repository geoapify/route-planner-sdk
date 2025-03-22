import { RoutePlannerResult } from "../../models/entities/route-planner-result";
import { AgentSolution, RoutePlannerInputData } from "../../models";
import { Utils } from "../utils";
import { RoutePlanner } from "../../route-planner";
import { OptimizeAgentInput } from "./optimize-agent-input";

export class RouteResultEditorBase {
    protected readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = result;
    }

    protected async optimizeRoute(optimizeAgentInput: OptimizeAgentInput): Promise<RoutePlannerResult> {
        let newRawData: RoutePlannerInputData = Utils.cloneObject(this.result.getRaw().inputData);

        newRawData.agents = newRawData.agents.filter(nextAgent => nextAgent.id == optimizeAgentInput.agentId);
        newRawData.jobs = newRawData.jobs.filter(nextJob => optimizeAgentInput.agentJobIds.has(nextJob.id!));
        newRawData.shipments = newRawData.shipments.filter(nextShipment => optimizeAgentInput.agentShipmentIds.has(nextShipment.id!));
        newRawData.locations = newRawData.locations.filter(nextLocation => optimizeAgentInput.agentLocationIds.has(nextLocation.id!));

        const planner = new RoutePlanner(this.result.getOptions(), newRawData);
        return await planner.plan();
    }

    protected updateAgent(newResult: RoutePlannerResult) {
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

    protected generateOptimizeAgentInput(agentId: string, existingAgent?: AgentSolution): OptimizeAgentInput {
        if (!existingAgent) {
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

    protected checkIfArrayIsUnique(myArray: any[]) {
        return myArray.length === new Set(myArray).size;
    }

    protected getInitialAgentIndex(agentId: string): number {
        return this.result.getRaw().inputData.agents.findIndex(item => item.id == agentId);
    }

    protected getInitialJobIndex(jobId: string): number {
        return this.result.getRaw().inputData.jobs.findIndex(item => item.id == jobId);
    }

    protected getInitialShipmentIndex(shipmentId: string): number {
        return this.result.getRaw().inputData.shipments.findIndex(item => item.id == shipmentId);
    }

    protected validateAgent(agentId: string) {
        let agentIndex = this.getInitialAgentIndex(agentId);
        if (agentIndex == -1) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
    }

    private updateUnassignedItems(newResult: RoutePlannerResult) {
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

    private getUnassignedJobs(result: RoutePlannerResult): string[] {
        return result.getUnassignedJobs().map((jobIndex) => {
            return this.result.getRaw().inputData.jobs[jobIndex].id!;
        });
    }

    private getUnassignedShipments(result: RoutePlannerResult): string[] {
        return result.getUnassignedShipments().map((jobIndex) => {
            return this.result.getRaw().inputData.shipments[jobIndex].id!;
        });
    }
}