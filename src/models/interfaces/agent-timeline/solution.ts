
import {AgentPlan} from "./agent-plan";
import {TravelMode} from "../../types";
import {RoutePlannerInputData} from "../route-planner-input-data";

export interface Solution {
    mode: TravelMode;
    params: RoutePlannerInputData,
    agentPlans: AgentPlan[],
    issues?: {
        unassignedAgents?: number[],
        unassignedJobs?: number[],
        unassignedShipments?: number[],
    }
}
