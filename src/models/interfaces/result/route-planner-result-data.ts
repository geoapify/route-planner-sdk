import { RoutePlannerInputData } from "../route-planner-input-data";
import { AgentPlanData } from "../nested/result/agent-plan-data";
import { RoutePlannerResultResponseData } from "./route-planner-result-response-data";

export interface RoutePlannerResultData {
    agents: AgentPlanData[];
    inputData: RoutePlannerInputData;
    unassignedAgents: number[];
    unassignedJobs: number[];
    unassignedShipments: number[];
}