import { RoutePlannerInputData } from "../route-planner-input-data";
import { AgentPlanData } from "../nested/response/properties-response-data";
import { RoutePlannerResultResponseData } from "./route-planner-result-response-data";

export interface RoutePlannerResultData {
    agents: AgentPlanData[];
    inputData: RoutePlannerInputData;
    unassignedAgents: number[];
    unassignedJobs: number[];
    unassignedShipments: number[];
}
