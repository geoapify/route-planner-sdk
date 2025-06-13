import { RoutePlannerResult } from "../../models/entities/route-planner-result";
import {
    AgentData,
    AgentSolution,
    FeatureResponseData,
    JobData,
    RoutePlannerInputData, RoutePlannerResultResponseData,
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
        this.generateOptimizedRoute(newRawData, optimizeAgentInput, originalIndexes);

        const planner = new RoutePlanner(this.result.getOptions(), newRawData);
        let result =  await planner.plan();

        let newFeatureResponse = result.getRawData().features[0];
        if(newFeatureResponse) {
            this.fixAgentIndex(optimizeAgentInput.agentIndex, newFeatureResponse);
            this.fixShipmentJobIndexes(newFeatureResponse, originalIndexes);
            this.fixWaypointIndexes(newFeatureResponse, originalIndexes);
            this.fixUnassignedItems(result.getRawData(), originalIndexes);
        }
        return result;
    }

    private generateOptimizedRoute(newRawData: RoutePlannerInputData, optimizeAgentInput: OptimizeAgentInput, originalIndexes: {
        originalAgentIndex: number;
        originalShipmentsIndexes: Record<number, number>;
        originalJobsIndexes: Record<number, number>
    }) {
        newRawData.agents = newRawData.agents?.filter((nextAgent, index) => index == optimizeAgentInput.agentIndex);
        let newJobIndex = 0;
        let newJobs: JobData[] = [];
        newRawData.jobs?.forEach(((nextJob, index) => {
            if (optimizeAgentInput.agentJobIndexes.has(index)) {
                newJobs[newJobIndex] = nextJob;
                originalIndexes.originalJobsIndexes[newJobIndex] = index;
                newJobIndex++;
            }
        }));
        newRawData.jobs = newJobs;

        let newShipmentIndex = 0;
        let newShipments: ShipmentData[] = [];
        newRawData.shipments?.forEach(((nextShipment, index) => {
            if (optimizeAgentInput.agentShipmentIndexes.has(index)) {
                newShipments[newShipmentIndex] = nextShipment;
                originalIndexes.originalShipmentsIndexes[newShipmentIndex] = index;
                newShipmentIndex++;
            }
        }));
        newRawData.shipments = newShipments;
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

    protected validateAgent(agentIndex: number) {
        let agentFound = this.getAgentByIndex(agentIndex);
        if (!agentFound) {
            throw new Error(`Agent with index ${agentIndex} not found`);
        }
    }

    private updateUnassignedItems(newResult: RoutePlannerResult) {
        this.updateUnassignedAgents(newResult);
        this.updateUnassignedJobs(newResult);
        this.updateUnassignedShipments(newResult);
    }

    private updateUnassignedAgents(newResult: RoutePlannerResult) {
        if (newResult.getUnassignedAgents().length > 0) {
            this.addUnassignedAgentIfNeeded(newResult.getRawData().properties.issues.unassigned_agents[0]);
        } else {
            this.addIssuesPropertiesIfMissing();
            if(!this.result.getRawData().properties.issues.unassigned_agents) {
                this.result.getRawData().properties.issues.unassigned_agents = [];
            }
            this.result.getRawData().properties.issues.unassigned_agents =
                this.result.getRawData().properties.issues.unassigned_agents.filter(unassignedAgentIndex => unassignedAgentIndex != newResult.getData().agents[0].agentIndex);
        }
    }

    private updateUnassignedJobs(newResult: RoutePlannerResult) {
        let unassignedJobs = this.getUnassignedJobs(newResult);
        unassignedJobs.forEach(jobIndex => {
            if (!this.result.getRawData().properties.issues?.unassigned_jobs?.includes(jobIndex)) {
                this.addIssuesPropertiesIfMissing();
                this.generateEmptyUnassignedJobsIfNeeded();
                this.result.getRawData().properties.issues.unassigned_jobs.push(jobIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedJobs = newResult.getRawData().features[0].properties.actions.filter(action => action.job_index != undefined).map(action => action.job_index!);
            assignedJobs.forEach(jobIndex => {
                if (this.result.getRawData().properties.issues?.unassigned_jobs?.includes(jobIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    this.generateEmptyUnassignedJobsIfNeeded();
                    this.result.getRawData().properties.issues.unassigned_jobs =
                        this.result.getRawData().properties.issues.unassigned_jobs.filter(unassignedJobIndex => unassignedJobIndex != jobIndex);
                }
            });
        }
    }

    private updateUnassignedShipments(newResult: RoutePlannerResult) {
        let unassignedShipments = this.getUnassignedShipments(newResult);
        unassignedShipments.forEach(shipmentIndex => {
            if (!this.result.getRawData().properties.issues?.unassigned_shipments?.includes(shipmentIndex)) {
                this.addIssuesPropertiesIfMissing();
                this.generateEmptyUnassignedShipmentsIfNeeded();
                this.result.getRawData().properties.issues.unassigned_shipments.push(shipmentIndex);
            }
        });
        if(newResult.getRawData().features.length > 0) {
            let assignedShipments = newResult.getRawData().features[0].properties.actions.filter(action => action.shipment_index != undefined).map(action => action.shipment_index!);
            assignedShipments.forEach(shipmentIndex => {
                if (this.result.getRawData().properties.issues?.unassigned_shipments?.includes(shipmentIndex)) {
                    this.addIssuesPropertiesIfMissing();
                    this.generateEmptyUnassignedShipmentsIfNeeded();
                    this.result.getRawData().properties.issues.unassigned_shipments =
                        this.result.getRawData().properties.issues.unassigned_shipments.filter(unassignedShipmentIndex => unassignedShipmentIndex != shipmentIndex);
                }
            });
        }
    }

    private getUnassignedJobs(newResult: RoutePlannerResult): number[] {
        if(!newResult.getRawData().properties.issues || !newResult.getRawData().properties.issues.unassigned_jobs) {
            return [];
        }
        return newResult.getRawData().properties.issues.unassigned_jobs;
    }

    private getUnassignedShipments(newResult: RoutePlannerResult): number[] {
        if(!newResult.getRawData().properties.issues || !newResult.getRawData().properties.issues.unassigned_shipments) {
            return [];
        }
        return newResult.getRawData().properties.issues.unassigned_shipments;
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
                if(action.shipment_index != undefined) {
                    action.shipment_index = originalIndexes.originalShipmentsIndexes[action.shipment_index!];
                }
                if(action.job_index != undefined) {
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

    private fixUnassignedItems(rawData: RoutePlannerResultResponseData, originalIndexes: any) {
        if (rawData.properties.issues?.unassigned_agents) {
            rawData.properties.issues.unassigned_agents =
                rawData.properties.issues.unassigned_agents.map((agentIndex: number) => {
                    return originalIndexes.originalAgentIndex;
                });
        }
        if (rawData.properties.issues?.unassigned_jobs) {
            rawData.properties.issues.unassigned_jobs =
                rawData.properties.issues.unassigned_jobs.map((jobIndex: number) => {
                    return originalIndexes.originalJobsIndexes[jobIndex];
                });
        }
        if (rawData.properties.issues?.unassigned_shipments) {
            rawData.properties.issues.unassigned_shipments =
                rawData.properties.issues.unassigned_shipments.map((shipmentIndex: number) => {
                    return originalIndexes.originalShipmentsIndexes[shipmentIndex];
                });
        }
    }
}