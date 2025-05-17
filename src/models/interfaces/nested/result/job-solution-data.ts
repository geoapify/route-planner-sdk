import {RouteActionData} from "./route-action-data";
import {AgentSolutionData} from "./agent-solution-data";
import {JobData} from "../input/job-data";

export interface JobSolutionData {
    agentId: string;
    actions: RouteActionData[];
    agent: AgentSolutionData;
    job: JobData;
}
