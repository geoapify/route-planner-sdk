import { RouteAction } from "./route-action";

export interface Waypoint {
    original_location_index?: number;
    original_location_id?: string;
    original_location: [number, number];
    location: [number, number];
    start_time: number;
    duration: number;
    actions: RouteAction[];
    prev_leg_index?: number;
    next_leg_index?: number;
}