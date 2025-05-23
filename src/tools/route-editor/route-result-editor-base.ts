import { RoutePlannerResult } from "../../models/entities/route-planner-result";
import { AgentSolution, FeatureResponseData, RoutePlannerInputData } from "../../models";
import { Utils } from "../utils";
import { RoutePlanner } from "../../route-planner";
import { OptimizeAgentInput } from "./optimize-agent-input";

export class RouteResultEditorBase {
    protected readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = result;
    }

    protected async optimizeRoute(optimizeAgentInput: OptimizeAgentInput): Promise<RoutePlannerResult> {
        let newRawData: RoutePlannerInputData = Utils.cloneObject(this.result.getRawData().properties.params);

        newRawData.agents = newRawData.agents?.filter(nextAgent => nextAgent.id == optimizeAgentInput.agentId);
        newRawData.jobs = newRawData.jobs?.filter(nextJob => optimizeAgentInput.agentJobIds.has(nextJob.id!));
        newRawData.shipments = newRawData.shipments?.filter(nextShipment => optimizeAgentInput.agentShipmentIds.has(nextShipment.id!));

        const planner = new RoutePlanner(this.result.getOptions(), newRawData);
        return await planner.plan();
    }

    protected removeAgent(agentId: string) {
        let agentIndex = this.getInitialAgentIndex(agentId);
        this.removeAgentWithId(agentId);
        this.addUnassignedAgentIfNeeded(agentIndex);
        // TODO: maybe we need to add shipments/locations in unassigned arrays
    }

    private removeAgentWithId(agentId: string) {
        this.result.getRawData().features = this.result.getRawData().features.filter(agent => agent.properties.agent_id != agentId);
    }

    protected updateAgent(newResult: RoutePlannerResult) {
        let agentId = newResult.getRawData().properties.params.agents[0].id!;
        if (newResult.getUnassignedAgents().length > 0) {
            let agentIndex = this.getInitialAgentIndex(agentId);
            if (!this.result.getRawData().properties.issues.unassigned_agents.includes(agentIndex)) {
                this.removeAgentWithId(agentId);
            } else {
                this.updateResultWithUpdatedAgent(newResult, agentId);
            }
            this.updateUnassignedItems(newResult);
        } else {
            let existingAgentSolution = this.result.getAgentSolution(agentId);
            if (existingAgentSolution) {
                this.removeAgentWithId(agentId);
            }
            this.updateResultWithUpdatedAgent(newResult, agentId);
            this.updateUnassignedItems(newResult);
        }
    }

    private updateResultWithUpdatedAgent(newResult: RoutePlannerResult, agentId: string) {
        let newFeatureResponse = newResult.getRawData().features[0];
        this.fixAgentIndex(agentId, newFeatureResponse);
        this.fixShipmentJobIndexes(newFeatureResponse);
        this.result.getRawData().features.push(newFeatureResponse);
    }

    protected generateOptimizeAgentInput(agentId: string, existingAgent?: AgentSolution): OptimizeAgentInput {
        if (!existingAgent) {
            return new OptimizeAgentInput(agentId, [], []);
        }
        let agentJobs = existingAgent.getActions()
            .filter(action => action.getJobId() !== undefined)
            .map(action => action.getJobId()!);
        let agentShipments = existingAgent.getActions()
            .filter(action => action.getShipmentId() !== undefined)
            .map(action => action.getShipmentId()!);
        return new OptimizeAgentInput(existingAgent.getAgentId(), agentJobs, agentShipments);
    }

    protected checkIfArrayIsUnique(myArray: any[]) {
        return myArray.length === new Set(myArray).size;
    }

    protected getInitialAgentIndex(agentId: string): number {
        return this.result.getRawData().properties.params.agents.findIndex(item => item.id == agentId);
    }

    protected getInitialJobIndex(jobId: string): number {
        return this.result.getRawData().properties.params.jobs.findIndex(item => item.id == jobId);
    }

    protected getInitialShipmentIndex(shipmentId: string): number {
        return this.result.getRawData().properties.params.shipments.findIndex(item => item.id == shipmentId);
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
        let agentId = newResult.getRawData().properties.params.agents[0].id!;
        let agentIndex = this.getInitialAgentIndex(agentId);
        if (newResult.getUnassignedAgents().length > 0) {
            this.addUnassignedAgentIfNeeded(agentIndex);
        } else {
            this.addIssuesPropertiesIfMissing();
            if(!this.result.getRawData().properties.issues.unassigned_agents) {
                this.result.getRawData().properties.issues.unassigned_agents = [];
            }
            this.result.getRawData().properties.issues.unassigned_agents =
                this.result.getRawData().properties.issues.unassigned_agents.filter(unassignedAgentIndex => unassignedAgentIndex != agentIndex);
        }
    }

    private updateUnassignedJobs(newResult: RoutePlannerResult) {
        let unassignedJobs = this.getUnassignedJobs(newResult);
        unassignedJobs.forEach(jobId => {
            let initialJobIndex = this.getInitialJobIndex(jobId);
            if (!this.result.getRawData().properties.issues.unassigned_jobs?.includes(initialJobIndex)) {
                this.addIssuesPropertiesIfMissing();
                if(!this.result.getRawData().properties.issues.unassigned_jobs) {
                    this.result.getRawData().properties.issues.unassigned_jobs = [];
                }
                this.result.getRawData().properties.issues.unassigned_jobs.push(initialJobIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedJobs = newResult.getRawData().features[0].properties.actions.filter(action => action.job_id).map(action => action.job_id!);
            assignedJobs.forEach(jobId => {
                let initialJobIndex = this.getInitialJobIndex(jobId);
                if (this.result.getRawData().properties.issues.unassigned_jobs?.includes(initialJobIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    if(!this.result.getRawData().properties.issues.unassigned_jobs) {
                        this.result.getRawData().properties.issues.unassigned_jobs = [];
                    }
                    this.result.getRawData().properties.issues.unassigned_jobs =
                        this.result.getRawData().properties.issues.unassigned_jobs.filter(unassignedJobIndex => unassignedJobIndex != initialJobIndex);
                }
            });
        }
    }

    private updateUnassignedShipments(newResult: RoutePlannerResult) {
        let unassignedShipments = this.getUnassignedShipments(newResult);
        unassignedShipments.forEach(shipmentId => {
            let initialShipmentIndex = this.getInitialShipmentIndex(shipmentId);
            if (!this.result.getRawData().properties.issues.unassigned_shipments?.includes(initialShipmentIndex)) {
                this.addIssuesPropertiesIfMissing();
                if(!this.result.getRawData().properties.issues.unassigned_shipments) {
                    this.result.getRawData().properties.issues.unassigned_shipments = [];
                }
                this.result.getRawData().properties.issues.unassigned_shipments.push(initialShipmentIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedShipments = newResult.getRawData().features[0].properties.actions.filter(action => action.shipment_id).map(action => action.shipment_id!);
            assignedShipments.forEach(shipmentId => {
                let initialShipmentIndex = this.getInitialShipmentIndex(shipmentId);
                if (this.result.getRawData().properties.issues.unassigned_shipments?.includes(initialShipmentIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    if(!this.result.getRawData().properties.issues.unassigned_shipments) {
                        this.result.getRawData().properties.issues.unassigned_shipments = [];
                    }
                    this.result.getRawData().properties.issues.unassigned_shipments =
                        this.result.getRawData().properties.issues.unassigned_shipments.filter(unassignedShipmentIndex => unassignedShipmentIndex != initialShipmentIndex);
                }
            });
        }
    }

    private getUnassignedJobs(newResult: RoutePlannerResult): string[] {
        if(!newResult.getRawData().properties.issues || !newResult.getRawData().properties.issues.unassigned_jobs) {
            return [];
        }
        return newResult.getRawData().properties.issues.unassigned_jobs.map((jobIndex) => {
            return newResult.getRawData().properties.params.jobs[jobIndex].id!;
        });
    }

    private getUnassignedShipments(newResult: RoutePlannerResult): string[] {
        if(!newResult.getRawData().properties.issues || !newResult.getRawData().properties.issues.unassigned_shipments) {
            return [];
        }
        return newResult.getRawData().properties.issues.unassigned_shipments.map((jobIndex) => {
            return newResult.getRawData().properties.params.shipments[jobIndex].id!;
        });
    }

    private addUnassignedAgentIfNeeded(agentIndex: number) {
        if (!this.result.getRawData().properties.issues.unassigned_agents.includes(agentIndex)) {
            if (!this.result.getRawData().properties.issues.unassigned_agents) {
                this.result.getRawData().properties.issues.unassigned_agents = [];
            }
            this.result.getRawData().properties.issues.unassigned_agents.push(agentIndex);
        }
    }

     private addIssuesPropertiesIfMissing() {
        if (!this.result.getRawData().properties.issues) {
            this.result.getRawData().properties.issues = {
                unassigned_shipments: [],
                unassigned_jobs: [],
                unassigned_agents: []
            };
        }
    }

    private fixAgentIndex(agentId: string, agentData: FeatureResponseData) {
        let agentIndexFound = this.getInitialAgentIndex(agentId);
        if(agentIndexFound != -1) {
            agentData.properties.agent_index = agentIndexFound;
        } else {
            console.log(`Agent with id ${agentId} not found in the result`);
        }
    }

    private fixShipmentJobIndexes(agentData: FeatureResponseData) {
        agentData.properties.actions.forEach(action => {
            if(action.shipment_id) {
                action.shipment_index = this.getInitialShipmentIndex(action.shipment_id);
            }
            if(action.job_id) {
                action.job_index = this.getInitialJobIndex(action.job_id);
            }
        })
    }
}