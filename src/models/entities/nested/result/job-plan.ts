import {RouteAction} from "./route-action";
import {AgentPlan} from "./agent-plan";
import {Job} from "../input/job";
import { RoutePlannerResult } from "../../route-planner-result";
import { JobData } from "../../../interfaces";

export class JobPlan {

    constructor(private readonly jobIndex: number, private readonly jobInputData: JobData, private readonly agentPlan: AgentPlan | undefined) {
        if (!jobInputData) {
            throw new Error("jobInputData is undefined");
        }
    }


    getAgentId(): string | undefined {
        return this.agentPlan ? this.agentPlan.getAgentId() : undefined;
    }

    getAgentIndex(): number | undefined {
        return this.agentPlan? this.agentPlan.getAgentIndex() : undefined;
    }

    getRouteActions(): RouteAction[] {
        return this.agentPlan ? this.agentPlan.getActions().filter((action: RouteAction) => {
            return action.getJobIndex() === this.jobIndex;
        }) : [];
    }

    getAgentPlan(): AgentPlan | undefined {
        return this.agentPlan;
    }

    getJobInputData(): JobData {
        return this.jobInputData;
    }

    getJobIndex(): number {
        return this.jobIndex;
    }
}