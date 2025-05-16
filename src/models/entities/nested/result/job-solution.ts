import {JobSolutionData} from "../../../interfaces/nested/result/job-solution-data";
import {RouteAction} from "./route-action";
import {AgentSolution} from "./agent-solution";
import {Job} from "../input/job";

export class JobSolution {
    private readonly raw: JobSolutionData;

    constructor(raw?: JobSolutionData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("JobSolutionData is undefined");
        }
    }

    getRaw(): JobSolutionData {
        return this.raw;
    }

    getAgentId(): string {
        return this.raw.agentId;
    }

    getActions(): RouteAction[] {
        return this.raw.actions.map((action) => new RouteAction(action));
    }

    getAgent(): AgentSolution {
        return new AgentSolution(this.raw.agent);
    }

    getJob(): Job {
        return new Job(this.raw.job);
    }
}