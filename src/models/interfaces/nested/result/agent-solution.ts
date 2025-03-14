import { Waypoint } from "./waypoint";
import { RouteAction } from "./route-action";
import { RouteLeg } from "./route-leg";

export interface AgentSolution {
    agentIndex: number;
    agentId: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs: RouteLeg[];
    actions: RouteAction[];
    waypoints: Waypoint[];
}
