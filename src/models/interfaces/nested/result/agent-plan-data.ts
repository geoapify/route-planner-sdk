import { WaypointResponseData } from "../response/waypoint-response-data";
import { LegResponseData } from "../response/leg-response-data";
import { ActionResponseData } from "../response/action-response-data";

export interface AgentPlanData {
    agentIndex: number;
    agentId: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs: LegResponseData[];
    actions: ActionResponseData[];
    waypoints: WaypointResponseData[];
}
