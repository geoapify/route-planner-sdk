import { RoutePlannerData } from "../route-planner-data";
import { AgentSolution } from "../nested/result/agent-solution";

export interface RoutePlannerResultData {
    agents: AgentSolution[];
    inputData: RoutePlannerData;
    unassignedAgents: number[];
    unassignedJobs: number[];
    unassignedShipments: number[];
}