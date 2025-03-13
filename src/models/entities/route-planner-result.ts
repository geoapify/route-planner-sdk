import { AgentSolution } from "../interfaces/nested/result/agent-solution";
import { RoutePlannerResultData, Waypoint } from "../interfaces";
import { RoutePlannerOptions } from "../interfaces/route-planner-options";

/**
 * Provides convenient methods for reading Route Planner API results.
 */
export class RoutePlannerResult {
    // private readonly rawData: RoutePlannerResultData;
    // private options: RoutePlannerOptions;
    //
    // constructor(options: RoutePlannerOptions, rawData: RoutePlannerResultData ) {
    //     this.rawData = rawData;
    //     this.options = options;
    // }
    //
    // /**
    //  * Returns the raw API response.
    //  */
    // getRaw(): RoutePlannerResultData {
    //     return this.rawData;
    // }
    //
    // /**
    //  * Returns a list of all assigned agent solutions.
    //  */
    // getAgentSolutions(): AgentSolution[] {
    //     return this.rawData.agents;
    // }
    //
    // /**
    //  * Finds an agent's solution by their ID.
    //  */
    // getAgentSolution(agentId: string): AgentSolution | undefined {
    //     return this.rawData.agents.find(agent => agent.agentId === agentId);
    // }
    //
    // /**
    //  * Retrieves all waypoints of a specific agent.
    //  */
    // getAgentWaypoints(agentId: string): Waypoint[] {
    //     const agent = this.getAgentSolution(agentId);
    //     return agent ? agent.waypoints : [];
    // }
    //
    // /**
    //  * Retrieves all jobs assigned to a specific agent.
    //  */
    // getAgentJobs(agentId: string): string[] {
    //     return this.getAgentStops(agentId)
    //         .filter(stop => stop.jobId !== undefined)
    //         .map(stop => stop.jobId as string);
    // }
    //
    // getAgentStops(agentId: string): Waypoint[] {
    //     return this.getRaw().agents.find(agent => agent.agentId === agentId).;
    //
    // }
    //
    // /**
    //  * Retrieves all shipments assigned to a specific agent.
    //  */
    // getAgentShipments(agentId: string): string[] {
    //     return this.getAgentStops(agentId)
    //         .filter(stop => stop.shipmentId !== undefined)
    //         .map(stop => stop.shipmentId as string);
    // }
    //
    // /**
    //  * Retrieves unassigned agents.
    //  */
    // getUnassignedAgents(): number[] {
    //     return this.rawData.unassignedAgents;
    // }
    //
    // /**
    //  * Retrieves unassigned jobs.
    //  */
    // getUnassignedJobs(): number[] {
    //     return this.rawData.unassignedJobs;
    // }
    //
    // /**
    //  * Retrieves unassigned shipments.
    //  */
    // getUnassignedShipments(): number[] {
    //     return this.rawData.unassignedShipments;
    // }
    //
    // /**
    //  * Retrieves detailed information about a specific job.
    //  */
    // getJobInfo(jobId: string): any {
    //     for (const agent of this.rawData.agents) {
    //         for (const stop of agent.stops) {
    //             if (stop.jobId === jobId) {
    //                 return { agentId: agent.agentId, stop, agent };
    //             }
    //         }
    //     }
    //     return null; // Job not found
    // }
    //
    // /**
    //  * Retrieves detailed information about a specific shipment.
    //  */
    // getShipmentInfo(shipmentId: string): any {
    //     for (const agent of this.rawData.agents) {
    //         for (const stop of agent.stops) {
    //             if (stop.shipmentId === shipmentId) {
    //                 return { agentId: agent.agentId, stop, agent };
    //             }
    //         }
    //     }
    //     return null; // Shipment not found
    // }
    //
    //
    // /**
    //  * Retrieves the route for a specific agent.
    //  * @param agentId - The ID of the agent.
    //  * @param callRoutingAPI - If true, fetches the real route from the Routing API.
    //  */
    // async getAgentRoute(agentId: string, callRoutingAPI: boolean = false): Promise<GeoJSON.Feature> {
    //     const agent = this.getAgentSolution(agentId);
    //     if (!agent) return null;
    //
    //     if (callRoutingAPI) {
    //         // Simulating an API call to fetch a real route
    //         const response = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${waypoints here}&apiKey=${API key from options}`);
    //         return response.json();
    //     }
    //
    //     return agent.waypoints.map(stop => stop.location);
    // }

}
