import { AgentSolutionData } from "../nested/result/agent-solution-data";

export interface AgentPlan extends AgentSolutionData {
    wayPointsLayer?: string;
    wayPointsTextLayer?: string;
    routeLayer?: string;
}
