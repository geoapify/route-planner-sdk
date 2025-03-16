import { WaypointData } from "./waypoint-data";
import { RouteActionData } from "./route-action-data";
import { RouteLegData } from "./route-leg-data";

export interface AgentSolutionData {
    agentIndex: number;
    agentId: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs: RouteLegData[];
    actions: RouteActionData[];
    waypoints: WaypointData[];
}
