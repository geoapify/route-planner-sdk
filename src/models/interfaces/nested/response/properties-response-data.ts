import { RouteLegData } from "./route-leg-data";
import { RouteActionData } from "./route-action-data";
import { WaypointData } from "./waypoint-data";

export interface AgentPlanData {
    agent_index: number;
    agent_id: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs: RouteLegData[];
    actions: RouteActionData[];
    waypoints: WaypointData[];
}
