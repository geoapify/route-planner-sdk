import { ActionResponseData } from "./action-response-data";

export interface WaypointResponseData {
    original_location: [number, number];
    original_location_index?: number;
    original_location_id?: number;
    location: [number, number];
    start_time: number;
    duration: number;
    actions: ActionResponseData[];
    prev_leg_index?: number;
    next_leg_index?: number;
}