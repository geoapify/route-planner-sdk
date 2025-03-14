import { RouteLegStep } from "./route-leg-step";

export interface RouteLeg {
    time: number;
    distance: number;
    steps: RouteLegStep[];
    from_waypoint_index: number;
    to_waypoint_index: number;
}