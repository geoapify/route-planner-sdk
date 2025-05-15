import { AgentSolution, RouteAction } from "../../../entities";

export interface RouteActionInfoData {
    agentId: string;
    actions: RouteAction[];
    agent: AgentSolution;
}