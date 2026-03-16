import {
    AgentData,
    JobData,
    RoutePlannerResultData,
    RoutePlannerResultResponseData, RoutePlannerResultResponseDataExtended,
    RoutingOptions,
    ShipmentData
} from "../interfaces";
import { AgentPlan } from "./nested/result/agent-plan";
import { RoutePlannerResultConverter } from "../../tools/route-planner-result-converter";
import { JobPlan } from "./nested/result/job-plan";
import { ShipmentPlan } from "./nested/result/shipment-plan";
import { IndexConverter } from "../../helpers/index-converter";
import { RoutePlannerCallOptions } from "../interfaces/route-planner-call-options";
import {ViolationError} from "./route-editor-exceptions";

/**
 * Provides convenient methods for reading Route Planner API results.
 */
export class RoutePlannerResult {

    private data: RoutePlannerResultData;
    private agentPlans: ( AgentPlan | undefined )[];
    private shipmentPlans: ShipmentPlan[];
    private jobPlans: JobPlan[];

    constructor(private readonly callOptions: RoutePlannerCallOptions,
                private readonly rawData: RoutePlannerResultResponseData | RoutePlannerResultResponseDataExtended) {
        this.data = RoutePlannerResultConverter.generateRoutePlannerResultData(this.rawData);

        // generate agent plans
        this.agentPlans = new Array(this.data.inputData.agents.length).fill(undefined);
        this.data.agents.forEach((agentPlan) => {
            this.agentPlans[agentPlan.agentIndex] = new AgentPlan(agentPlan, this.data.inputData.agents[agentPlan.agentIndex], this.getData().inputData, this.callOptions, this.getAgentViolations(agentPlan.agentIndex));
        });

        // generate shipment plans
        this.shipmentPlans = (this.data.inputData.shipments || []).map((shipmentData, shipmentIndex) => {
            const agentPlan = this.agentPlans.find((agentPlan: AgentPlan | undefined) => !!agentPlan && agentPlan.containsShipment(shipmentIndex));
            return new ShipmentPlan(shipmentIndex, shipmentData, agentPlan);
        });

        // generate job plans
        this.jobPlans = (this.data.inputData.jobs || []).map((jobData, jobIndex) => {
            const agentPlan = this.agentPlans.find((agentPlan: AgentPlan | undefined) => !!agentPlan && agentPlan.containsJob(jobIndex));
            return new JobPlan(jobIndex, jobData, agentPlan);
        }); 
    }

    /**
     * Returns the data returned by the Route Planner API.
     */
    getData(): RoutePlannerResultData {
        return this.data;
    }

    /**
     * Returns the raw data returned by the Route Planner API.
     */
    getRaw(): RoutePlannerResultResponseData {
        return this.rawData;
    }

    /**
     * Returns a list of all assigned agent solutions.
     */
    getAgentPlans(): (AgentPlan | undefined)[] {
        return this.agentPlans;
    }


    /**
     * Finds an agent's solution by their ID.
     */
    getAgentPlan(agentIdOrIndex: string | number): AgentPlan | undefined {
        const agentIndex = IndexConverter.convertAgentToIndex(this.getRaw(), agentIdOrIndex);
        if (agentIndex >= 0) {
            return this.agentPlans[agentIndex]
        }

        return undefined;
    }

    /**
     * Retrieves unassigned agents.
     */
    getUnassignedAgents(): AgentData[] {
        let data = this.getData();
        if(!data.unassignedAgents || data.unassignedAgents.length == 0) {
            return [];
        } else {
            return data.unassignedAgents.map(index => {
                return data.inputData.agents[index];
            })
        }
    }

    /**
     * Retrieves unassigned jobs.
     */
    getUnassignedJobs(): JobData[] {
        let data = this.getData();
        if(!data.unassignedJobs || data.unassignedJobs.length == 0) {
            return [];
        } else {
            return data.unassignedJobs.map(index => {
                return data.inputData.jobs[index];
            })
        }
    }

    /**
     * Retrieves unassigned shipments.
     */
    getUnassignedShipments(): ShipmentData[] {
        let data = this.getData();
        if(!data.unassignedShipments || data.unassignedShipments.length == 0) {
            return [];
        } else {
            return data.unassignedShipments.map(index => {
                return data.inputData.shipments[index];
            })
        }
    }

    /**
     * Returns a list of all assigned jobs
     */
    getJobPlans(): JobPlan[] {
        return this.jobPlans;
    }

    /**
     * Finds job solution by their ID or index.
     */
    getJobPlan(jobIdOrIndex: string | number): JobPlan | undefined {
        const jobIndex = IndexConverter.convertJobToIndex(this.getRaw(), jobIdOrIndex);
        if (jobIndex >= 0)
            return this.jobPlans[jobIndex];

        return undefined;
    }

    /**
     * Returns a list of all shipments
     */
    getShipmentPlans(): (ShipmentPlan)[] {
        return this.shipmentPlans;
    }

    /**
     * Finds shipment solution by their ID or index.
     */
    getShipmentPlan(shipmentIdOrIndex: string | number): ShipmentPlan | undefined {
        const shipmentIndex = IndexConverter.convertShipmentToIndex(this.getRaw(), shipmentIdOrIndex);
        if (shipmentIndex >= 0) {
            return this.shipmentPlans[shipmentIndex];
        }

        return undefined;
    }

    getCallOptions(): RoutePlannerCallOptions {
        return this.callOptions;
    }

    getRoutingOptions(): RoutingOptions {
        return this.data.inputData;
    }

    private getAgentViolations(agentIndex: number): ViolationError[] {
        const extendedData = this.rawData as RoutePlannerResultResponseDataExtended;
        return extendedData.properties.violations?.filter(violation => violation.agentIndex === agentIndex) ?? [];
    }
}
