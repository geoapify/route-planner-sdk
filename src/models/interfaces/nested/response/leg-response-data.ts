import { LegStepResponseData } from "./leg-step-response-data";

export interface LegResponseData {
    distance: number;
    time: number;
    steps: LegStepResponseData[];
    from_waypoint_index: number;
    to_waypoint_index: number;
}