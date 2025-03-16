import { RouteLegStepData } from "./route-leg-step-data";

export interface RouteLegData {
    time: number;
    distance: number;
    steps: RouteLegStepData[];
    from_waypoint_index: number;
    to_waypoint_index: number;
}