import { ActionResponseData } from "../response/action-response-data";
import { RouteAction } from "./route-action";

export interface Waypoint {
    original_location: [number, number];
    original_location_index?: number;
    original_location_id?: number;
    location: [number, number];
    start_time: number;
    duration: number;
    actions: RouteAction[];
    prev_leg_index?: number;
    next_leg_index?: number;
}
