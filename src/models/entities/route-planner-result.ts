import { RoutePlannerOptions } from "../interfaces/route-planner-options";
import {
    AgentData,
    JobData,
    RouteActionData,
    RoutePlannerResultData,
    RoutePlannerResultResponseData,
    ShipmentData
} from "../interfaces";
import { AgentSolution } from "./nested/result/agent-solution";
import { Waypoint } from "./nested/result/waypoint";
import { RouteAction } from "./nested/result/route-action";
import { RouteLeg } from "./nested/result/route-leg";
import { RouteActionInfo } from "./nested/result/route-action-info";
import { RoutePlannerResultConverter } from "../../tools/route-planner-result-converter";
import {JobSolution} from "./nested/result/job-solution";
import {ShipmentSolution} from "./nested/result/shipment-solution";
import {RoutingOptions} from "../interfaces/routing-options";

/**
 * Provides convenient methods for reading Route Planner API results.
 */
export class RoutePlannerResult {
    private readonly rawData: RoutePlannerResultResponseData
    private readonly options: RoutePlannerOptions;

    constructor(options: RoutePlannerOptions,
                rawData: RoutePlannerResultResponseData) {
        this.rawData = rawData;
        this.options = options;
    }

    /**
     * Returns the data returned by the Route Planner API.
     */
    getData(): RoutePlannerResultData {
        return RoutePlannerResultConverter.generateRoutePlannerResultData(this.rawData);
    }

    /**
     * Returns the raw data returned by the Route Planner API.
     */
    getRawData(): RoutePlannerResultResponseData {
        return this.rawData;
    }

    /**
     * Returns a list of all assigned agent solutions.
     */
    getAgentSolutions(): AgentSolution[] {
        return this.getData().agents.map(agent => new AgentSolution(agent));
    }

    /**
     * Returns a list of all agent solutions by index. (if it's not assigned, then it will be undefined)
     */
    getAgentSolutionsByIndex(): (AgentSolution | undefined)[] {
        let data = this.getData();
        let result = Array(data.inputData.agents.length);
        this.getData().agents.forEach(agent => {
            let agentSolution = new AgentSolution(agent)
            result[agentSolution.getAgentIndex()] = agentSolution;
        });
        return result;
    }

    /**
     * Finds an agent's solution by their ID.
     */
    getAgentSolution(agentId: string): AgentSolution | undefined {
        let agentFound = this.getData().agents.find(agent => agent.agentId === agentId)
        if(agentFound === undefined) {
            return undefined;
        } else {
            return new AgentSolution(agentFound);
        }
    }

    /**
     * Finds an agent's solution by their index.
     */
    getAgentSolutionByIndex(agentIndex: number): AgentSolution | undefined {
        let agentFound = this.getData().agents.find(agent => agent.agentIndex === agentIndex)
        if(agentFound === undefined) {
            return undefined;
        } else {
            return new AgentSolution(agentFound);
        }
    }

    /**
     * Retrieves all waypoints of a specific agent.
     */
    getAgentWaypoints(agentId: string): Waypoint[] {
        const agent = this.getAgentSolution(agentId);
        return agent ? agent.getWaypoints() : [];
    }

    /**
     * Retrieves all route actions of a specific agent.
     */
    getAgentRouteActions(agentId: string): RouteAction[] {
        const agent = this.getAgentSolution(agentId);
        return agent ? agent.getActions() : [];
    }

    /**
     * Retrieves all route legs of a specific agent.
     */
    getAgentRouteLegs(agentId: string): RouteLeg[] {
        const agent = this.getAgentSolution(agentId);
        return agent ? agent.getLegs() : [];
    }

    /**
     * Retrieves the options used to generate the result.
     */
    getOptions(): RoutePlannerOptions {
        return this.options;
    }

     /**
     * Retrieves all jobs assigned to a specific agent.
     */
    getAgentJobs(agentId: string): number[] {
        const agent = this.getAgentSolution(agentId);
        if(agent === undefined) {
            return [];
        }
        return agent.getActions()
            .filter(action => action.getJobIndex() !== undefined)
            .map(action => action.getJobIndex() as number);
    }

    /**
     * Retrieves all shipments assigned to a specific agent.
     */
    getAgentShipments(agentId: string): number[] {
        const agent = this.getAgentSolution(agentId);
        if(agent === undefined) {
            return [];
        }
        return Array.from(new Set(agent.getActions()
            .filter(action => action.getShipmentIndex() !== undefined)
            .map(action => action.getShipmentIndex() as number))).sort((a, b) => a - b);
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
    getJobSolutions(): JobSolution[] {
        let result: JobSolution[] = [];
        let agents = this.getAgentSolutions();

        agents.forEach(agent => {
            let agentActions = agent.getActions();
            let actionsByJob: Record<number, RouteActionData[]> = {};

            agentActions.forEach(action => {
                const jobIndex = action.getJobIndex();
                if (jobIndex !== undefined) {
                    if (!actionsByJob[jobIndex]) {
                        actionsByJob[jobIndex] = [];
                    }
                    actionsByJob[jobIndex].push(action.getRaw());
                }
            });

            for (const jobIndex in actionsByJob) {
                const actions = actionsByJob[+jobIndex];
                let jobSolution = {
                    agentId: agent.getAgentId(),
                    actions: actions,
                    agent: agent.getRaw(),
                    job: this.rawData.properties.params.jobs[actions[0].job_index!]
                }
                result.push(new JobSolution(jobSolution));
            }
        });
        return result;
    }

    /**
     * Finds job solution by their ID.
     */
    getJobSolution(jobId: string): JobSolution | undefined {
        for (let jobSolution of this.getJobSolutions()) {
            if (jobSolution.getJob().getRaw().id === jobId) {
                return jobSolution;
            }
        }
        return undefined;
    }

    /**
     * Returns a list of all assigned shipments
     */
    getShipmentSolutions(): ShipmentSolution[] {
        let result: ShipmentSolution[] = [];
        let agents = this.getAgentSolutions();

        agents.forEach(agent => {
            let agentActions = agent.getActions();
            let actionsByShipment: Record<number, RouteActionData[]> = {};

            agentActions.forEach(action => {
                const jobIndex = action.getShipmentIndex();
                if (jobIndex !== undefined) {
                    if (!actionsByShipment[jobIndex]) {
                        actionsByShipment[jobIndex] = [];
                    }
                    actionsByShipment[jobIndex].push(action.getRaw());
                }
            });

            for (const jobIndex in actionsByShipment) {
                const actions = actionsByShipment[+jobIndex];
                let shipment = {
                    agentId: agent.getAgentId(),
                    actions: actions,
                    agent: agent.getRaw(),
                    shipment: this.rawData.properties.params.shipments[actions[0].shipment_index!]
                }
                result.push(new ShipmentSolution(shipment));
            }
        });
        return result;
    }

    /**
     * Finds shipment solution by their ID.
     */
    getShipmentSolution(jobId: string): ShipmentSolution | undefined {
        for (let shipmentSolution of this.getShipmentSolutions()) {
            if (shipmentSolution.getShipment().getRaw().id === jobId) {
                return shipmentSolution;
            }
        }
        return undefined;
    }

    /**
     * Retrieves detailed information about a specific job.
     */
    getJobInfo(jobId: string): RouteActionInfo | undefined {
        if(!jobId) {
            return undefined;
        }
        let actions = [];
        let agentFound;
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getJobId() === jobId) {
                     actions.push(action);
                     agentFound = agent;
                }
            }
        }
        if(actions.length !== 0 && agentFound) {
            return new RouteActionInfo({ agentId: agentFound.getAgentId(), actions: actions, agent: agentFound });
        }
        return undefined; // Job not found
    }

    /**
     * Retrieves detailed information about a specific shipment.
     */
    getShipmentInfo(shipmentId: string): RouteActionInfo | undefined {
        if(!shipmentId) {
            return undefined;
        }
        let actions = [];
        let agentFound;
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getShipmentId() === shipmentId) {
                    actions.push(action);
                    agentFound = agent;
                }
            }
        }
        if(actions.length !== 0 && agentFound) {
            return new RouteActionInfo({ agentId: agentFound.getAgentId(), actions: actions, agent: agentFound });
        }
        return undefined; // Shipment not found
    }

    /**
     * Retrieves detailed information about a specific job.
     */
    getJobInfoByIndex(jobIndex: number): RouteActionInfo | undefined {
        if(jobIndex < 0) {
            return undefined;
        }
        let actions = [];
        let agentFound;
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getJobIndex() === jobIndex) {
                     actions.push(action);
                     agentFound = agent;
                }
            }
        }
        if(actions.length !== 0 && agentFound) {
            return new RouteActionInfo({ agentId: agentFound.getAgentId(), actions: actions, agent: agentFound });
        }
        return undefined; // Job not found
    }

    /**
     * Retrieves detailed information about a specific shipment.
     */
    getShipmentInfoByIndex(shipmentIndex: number): RouteActionInfo | undefined {
        if(shipmentIndex < 0) {
            return undefined;
        }
        let actions = [];
        let agentFound;
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getShipmentIndex() === shipmentIndex) {
                    actions.push(action);
                    agentFound = agent;
                }
            }
        }
        if(actions.length !== 0 && agentFound) {
            return new RouteActionInfo({ agentId: agentFound.getAgentId(), actions: actions, agent: agentFound });
        }
        return undefined; // Shipment not found
    }


    /**
     * Retrieves the route for a specific agent.
     * @param agentId - The ID of the agent.
     * @param options - The routing options.
     */
    async getAgentRoute(agentId: string, options: RoutingOptions): Promise<any | undefined> {
        const agent = this.getAgentSolution(agentId);
        if (!agent) return undefined;
        let waypoints = agent.getWaypoints().map(waypoint => "lonlat:" + waypoint.getLocation()).join('|');
        if (waypoints.length == 0) return undefined;

        const response = await fetch(this.constructRoutingRequest(waypoints, options));
        return await response.json();
    }

    private constructRoutingRequest(waypoints: string, options: RoutingOptions) {
        let url = `${this.getOptions().baseUrl}/v1/routing?waypoints=${waypoints}&apiKey=${this.getOptions().apiKey}`;
        if(options.mode) {
            url += `&mode=${options.mode}`;
        }
        if(options.type) {
            url += `&type=${options.type}`;
        }
        if(options.units) {
            url += `&units=${options.units}`;
        }
        if(options.lang) {
            url += `&lang=${options.lang}`;
        }
        if(options.avoid && options.avoid.length > 0) {
            url += `&avoid=${options.avoid.join('|')}`;
        }
        if(options.details && options.details.length > 0) {
            url += `&details=${options.details.join(',')}`;
        }
        if(options.traffic) {
            url += `&traffic=${options.traffic}`;
        }
        if(options.max_speed) {
            url += `&max_speed=${options.max_speed}`;
        }
        return url;
    }
}
