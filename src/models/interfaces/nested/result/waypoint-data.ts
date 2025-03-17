import { RouteActionData } from "./route-action-data";

export interface WaypointData {
    original_location: [number, number];
    original_location_index?: number;
    original_location_id?: number;
    location: [number, number];
    start_time: number;
    duration: number;
    actions: RouteActionData[];
    prev_leg_index?: number;
    next_leg_index?: number;
}
