import { RoutePlannerResult } from "../../models/entities/route-planner-result";
import {
    AgentData,
    AgentSolution,
    FeatureResponseData,
    JobData,
    RoutePlannerInputData,
    ShipmentData
} from "../../models";
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

        let originalIndexes = {
            originalAgentIndex: optimizeAgentInput.agentIndex,
            originalJobsIndexes: {} as Record<number, number>,
            originalShipmentsIndexes: {} as Record<number, number>,
        }
        newRawData.agents = newRawData.agents?.filter((nextAgent, index) => index == optimizeAgentInput.agentIndex);
        let newJobIndex = 0;
        let newJobs: JobData[] = [];
        newRawData.jobs?.forEach(((nextJob, index) => {
            if(optimizeAgentInput.agentJobIndexes.has(index)) {
                newJobs[newJobIndex] = nextJob;
                originalIndexes.originalJobsIndexes[newJobIndex] = index;
                newJobIndex++;
            }
        }));
        newRawData.jobs = newJobs;

        let newShipmentIndex = 0;
        let newShipments: ShipmentData[] = [];
        newRawData.shipments?.forEach(((nextShipment, index) => {
            if(optimizeAgentInput.agentShipmentIndexes.has(index)) {
                newShipments[newShipmentIndex] = nextShipment;
                originalIndexes.originalShipmentsIndexes[newShipmentIndex] = index;
                newShipmentIndex++;
            }
        }));
        newRawData.shipments = newShipments;

        const planner = new RoutePlanner(this.result.getOptions(), newRawData);
        let result =  await planner.plan();

        let newFeatureResponse = result.getRawData().features[0];
        if(newFeatureResponse) {
            this.fixAgentIndex(optimizeAgentInput.agentIndex, newFeatureResponse);
            this.fixShipmentJobIndexes(newFeatureResponse, originalIndexes);
            this.fixWaypointIndexes(newFeatureResponse, originalIndexes);
        }
        return result;
    }

    protected removeAgent(agentIndex: number) {
        this.removeAgentWithIndex(agentIndex);
        this.addUnassignedAgentIfNeeded(agentIndex);
        // TODO: maybe we need to add shipments/locations in unassigned arrays
    }

    private removeAgentWithIndex(agentIndex: number) {
        this.result.getRawData().features = this.result.getRawData().features.filter(agent => agent.properties.agent_index != agentIndex);
    }

    protected updateAgent(newResult: RoutePlannerResult, originalAgentIndex: number) {
        if (newResult.getUnassignedAgents().length > 0) {
            if (!this.result.getRawData().properties.issues.unassigned_agents.includes(originalAgentIndex)) {
                this.removeAgentWithIndex(originalAgentIndex);
            } else {
                this.updateResultWithUpdatedAgent(newResult, originalAgentIndex);
            }
            this.updateUnassignedItems(newResult);
        } else {
            let existingAgentSolution = this.result.getAgentSolutionByIndex(originalAgentIndex);
            if (existingAgentSolution) {
                this.removeAgentWithIndex(originalAgentIndex);
            }
            this.updateResultWithUpdatedAgent(newResult, originalAgentIndex);
            this.updateUnassignedItems(newResult);
        }
    }

    private updateResultWithUpdatedAgent(newResult: RoutePlannerResult, originalAgentIndex: number) {
        let newFeatureResponse = newResult.getRawData().features[0];
        this.result.getRawData().features.push(newFeatureResponse);
    }

    protected generateOptimizeAgentInput(agentIndex: number, existingAgent?: AgentSolution): OptimizeAgentInput {
        if (!existingAgent) {
            return new OptimizeAgentInput(agentIndex, [], []);
        }
        let agentJobs = existingAgent.getActions()
            .filter(action => action.getJobIndex() !== undefined)
            .map(action => action.getJobIndex()!);
        let agentShipments = existingAgent.getActions()
            .filter(action => action.getShipmentIndex() !== undefined)
            .map(action => action.getShipmentIndex()!);
        return new OptimizeAgentInput(existingAgent.getAgentIndex(), agentJobs, agentShipments);
    }

    protected checkIfArrayIsUnique(myArray: any[]) {
        return myArray.length === new Set(myArray).size;
    }

    protected getAgentByIndex(agentIndex: number): AgentData {
        return this.result.getRawData().properties.params.agents[agentIndex];
    }

    protected getJobByIndex(jobIndex: number): JobData {
        return this.result.getRawData().properties.params.jobs[jobIndex];
    }

    protected getShipmentByIndex(shipmentIndex: number): ShipmentData {
        return this.result.getRawData().properties.params.shipments[shipmentIndex];
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

    protected validateAgent(agentId: number) {
        let agentFound = this.getAgentByIndex(agentId);
        if (!agentFound) {
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
            if (!this.result.getRawData().properties.issues?.unassigned_jobs?.includes(initialJobIndex)) {
                this.addIssuesPropertiesIfMissing();
                this.generateEmptyUnassignedJobsIfNeeded();
                this.result.getRawData().properties.issues.unassigned_jobs.push(initialJobIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedJobs = newResult.getRawData().features[0].properties.actions.filter(action => action.job_id).map(action => action.job_id!);
            assignedJobs.forEach(jobId => {
                let initialJobIndex = this.getInitialJobIndex(jobId);
                if (this.result.getRawData().properties.issues?.unassigned_jobs?.includes(initialJobIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    this.generateEmptyUnassignedJobsIfNeeded();
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
            if (!this.result.getRawData().properties.issues?.unassigned_shipments?.includes(initialShipmentIndex)) {
                this.addIssuesPropertiesIfMissing();
                this.generateEmptyUnassignedShipmentsIfNeeded();
                this.result.getRawData().properties.issues.unassigned_shipments.push(initialShipmentIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedShipments = newResult.getRawData().features[0].properties.actions.filter(action => action.shipment_id).map(action => action.shipment_id!);
            assignedShipments.forEach(shipmentId => {
                let initialShipmentIndex = this.getInitialShipmentIndex(shipmentId);
                if (this.result.getRawData().properties.issues?.unassigned_shipments?.includes(initialShipmentIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    this.generateEmptyUnassignedShipmentsIfNeeded();
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

    private fixAgentIndex(originalAgentIndex: number, agentData: FeatureResponseData) {
        if(originalAgentIndex != -1) {
            agentData.properties.agent_index = originalAgentIndex;
        } else {
            console.log(`Agent with index ${originalAgentIndex} not found in the result`);
        }
    }

    private fixShipmentJobIndexes(agentData: FeatureResponseData, originalIndexes: any) {
        agentData.properties.actions.forEach(action => {
            if(action.shipment_index != undefined) {
                action.shipment_index = originalIndexes.originalShipmentsIndexes[action.shipment_index!];
            }
            if(action.job_index != undefined) {
                action.job_index = originalIndexes.originalJobsIndexes[action.job_index!];
            }
        })
    }

   private fixWaypointIndexes(agentData: FeatureResponseData, originalIndexes: any) {
        agentData.properties.waypoints.forEach(waypoint => {
            waypoint.actions.forEach(action => {
                if(action.shipment_id != undefined) {
                    action.shipment_index = originalIndexes.originalShipmentsIndexes[action.shipment_index!];
                }
                if(action.job_id != undefined) {
                    action.job_index = originalIndexes.originalJobsIndexes[action.job_index!];
                }
            })
        })
    }

    protected generateEmptyUnassignedShipmentsIfNeeded() {
        if (!this.result.getRawData().properties.issues) {
            this.result.getRawData().properties.issues = {
                unassigned_jobs: [],
                unassigned_agents: [],
                unassigned_shipments: []
            };
        } else {
            if (!this.result.getRawData().properties.issues.unassigned_shipments) {
                this.result.getRawData().properties.issues.unassigned_shipments = [];
            }
        }
    }

    protected generateEmptyUnassignedJobsIfNeeded() {
        if (!this.result.getRawData().properties.issues) {
            this.result.getRawData().properties.issues = {
                unassigned_jobs: [],
                unassigned_agents: [],
                unassigned_shipments: []
            };
        } else {
            if (!this.result.getRawData().properties.issues.unassigned_jobs) {
                this.result.getRawData().properties.issues.unassigned_jobs = [];
            }
        }
    }
}