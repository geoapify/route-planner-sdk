import { AgentSolution, RouteAction } from "../../../entities";

export interface RouteActionInfoData {
    agentId: string;
    action: RouteAction;
    agent: AgentSolution;
}