import { RoutePlannerOptions } from "../interfaces/route-planner-options";
import { RoutePlannerResultData, RoutePlannerResultResponseData } from "../interfaces";
import { AgentSolution } from "./nested/result/agent-solution";
import { Waypoint } from "./nested/result/waypoint";
import { RouteAction } from "./nested/result/route-action";
import { RouteLeg } from "./nested/result/route-leg";
import { TravelMode } from "../types";
import { RouteActionInfo } from "./nested/result/route-action-info";
import { RoutePlannerResultConverter } from "../../tools/route-planner-result-converter";

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
    getAgentJobs(agentId: string): string[] {
        const agent = this.getAgentSolution(agentId);
        if(agent === undefined) {
            return [];
        }
        return agent.getActions()
            .filter(action => action.getJobId() !== undefined)
            .map(action => action.getJobId() as string);
    }

    /**
     * Retrieves all shipments assigned to a specific agent.
     */
    getAgentShipments(agentId: string): string[] {
        const agent = this.getAgentSolution(agentId);
        if(agent === undefined) {
            return [];
        }
        return agent.getActions()
            .filter(action => action.getShipmentId() !== undefined)
            .map(action => action.getShipmentId() as string);
    }

    /**
     * Retrieves unassigned agents.
     */
    getUnassignedAgents(): number[] {
        return this.getData().unassignedAgents ? this.getData().unassignedAgents : [];
    }

    /**
     * Retrieves unassigned jobs.
     */
    getUnassignedJobs(): number[] {
        return this.getData().unassignedJobs ? this.getData().unassignedJobs : [];
    }

    /**
     * Retrieves unassigned shipments.
     */
    getUnassignedShipments(): number[] {
        return this.getData().unassignedShipments ? this.getData().unassignedShipments : [];
    }

    /**
     * Retrieves detailed information about a specific job.
     */
    getJobInfo(jobId: string): RouteActionInfo | undefined {
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getJobId() === jobId) {
                    return new RouteActionInfo({ agentId: agent.getAgentId(), action: action, agent: agent });
                }
            }
        }
        return undefined; // Job not found
    }

    /**
     * Retrieves detailed information about a specific shipment.
     */
    getShipmentInfo(shipmentId: string): RouteActionInfo | undefined {
        for (const agent of this.getAgentSolutions()) {
            for (const action of agent.getActions()) {
                if (action.getShipmentId() === shipmentId) {
                    return new RouteActionInfo({ agentId: agent.getAgentId(), action: action, agent: agent });
                }
            }
        }
        return undefined; // Shipment not found
    }


    /**
     * Retrieves the route for a specific agent.
     * @param agentId - The ID of the agent.
     * @param mode
     */
    async getAgentRoute(agentId: string, mode: TravelMode): Promise<any | undefined> {
        const agent = this.getAgentSolution(agentId);
        if (!agent) return undefined;
        let waypoints = agent.getWaypoints().map(waypoint => "lonlat:" + waypoint.getLocation()).join('|');
        if (waypoints.length == 0) return undefined;

        const response = await fetch(`${this.getOptions().baseUrl}/v1/routing?waypoints=${waypoints}&apiKey=${this.getOptions().apiKey}&mode=${mode}`);
        return await response.json();
    }
}
