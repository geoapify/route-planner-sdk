import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";

export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = result;
    }

    public getRoutePlannerResult(): RoutePlannerResult {
        return this.result;
    }

    /**
     * Assigns a job to an agent. Removes the job if it's currently assigned to another agent
     * @param agentId - The ID of the agent.
     * @param jobIds
     * @returns {boolean} - Returns true if the job was successfully assigned.
     */
    async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
        return new RouteResultJobEditor(this.result).assignJobs(agentId, jobIds);
    }
}