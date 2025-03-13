import { LegResponseData } from "./leg-response-data";
import { ActionResponseData } from "./action-response-data";
import { WaypointResponseData } from "./waypoint-response-data";

export interface PropertiesResponseData {
    agent_index: number;
    agent_id: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs?: LegResponseData[];
    actions: ActionResponseData[];
    waypoints: WaypointResponseData[];
}