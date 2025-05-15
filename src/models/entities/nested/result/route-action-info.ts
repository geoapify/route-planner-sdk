import { RouteActionInfoData } from "../../../interfaces/nested/result/route-action-info-data";
import { RouteAction } from "./route-action";
import { AgentSolution } from "./agent-solution";

export class RouteActionInfo {
    private readonly raw: RouteActionInfoData;

    constructor(raw?: RouteActionInfoData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("RouteActionInfo is undefined");
        }
    }

    getRaw(): RouteActionInfoData {
        return this.raw;
    }

    getAgentId(): string {
        return this.raw.agentId;
    }

    getActions(): RouteAction[] {
        return this.raw.actions;
    }
    getAgent(): AgentSolution {
        return this.raw.agent;
    }
}