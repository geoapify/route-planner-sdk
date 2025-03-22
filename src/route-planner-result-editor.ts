import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";

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
     * @param jobIds - The IDs of the jobs.
     * @returns {boolean} - Returns true if the job was successfully assigned.
     */
    async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
        return new RouteResultJobEditor(this.result).assignJobs(agentId, jobIds);
    }

    /**
     * Assigns a shipment to an agent. Removes the shipment if it's currently assigned to another agent
     * @param shipmentIds - The IDs of the shipments.
     * @param agentId - The ID of the agent.
     * @returns {boolean} - Returns true if the shipment was successfully assigned.
     */
    async assignShipments(agentId: string, shipmentIds: string[]): Promise<boolean> {
        return new RouteResultShipmentEditor(this.result).assignShipments(agentId, shipmentIds);
    }
}