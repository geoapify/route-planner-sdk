import {AgentData} from "../nested/input/agent-data";
import {WaypointData} from "../nested/result/waypoint-data";
import {RouteType, TrafficType, TravelMode} from "../../types";

export interface Task {
    mode: TravelMode;
    type: RouteType;
    traffic: TrafficType;
    agents: AgentData[];
    storages: Storage[];
    waypoints: WaypointData[];
}
