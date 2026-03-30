import { RouteLegStepData } from "./route-leg-step-data";

export interface RouteLegData {
    distance: number;
    time: number;
    steps: RouteLegStepData[];
    from_waypoint_index: number;
    to_waypoint_index: number;
}
