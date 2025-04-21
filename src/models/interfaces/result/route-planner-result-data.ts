import { RoutePlannerInputData } from "../route-planner-input-data";
import { AgentSolutionData } from "../nested/result/agent-solution-data";
import { RoutePlannerResultResponseData } from "./route-planner-result-response-data";

export interface RoutePlannerResultData {
    agents: AgentSolutionData[];
    inputData: RoutePlannerInputData;
    unassignedAgents: number[];
    unassignedJobs: number[];
    unassignedShipments: number[];
}