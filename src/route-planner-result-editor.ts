import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { Utils } from "./tools/utils";
import { Job, Shipment } from "./models";

export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = new RoutePlannerResult(Utils.cloneObject(result.getOptions()),
            Utils.cloneObject(result.getRawData()));
    }

    /**
     * Assigns a job to an agent. Removes the job if it's currently assigned to another agent
     * @param agentId - The ID of the agent.
     * @param jobIds - The IDs of the jobs.
     * @returns {boolean} - Returns true if the job was successfully assigned.
     */
    async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
        this.assertArray(jobIds, "jobIds");
        return new RouteResultJobEditor(this.result).assignJobs(agentId, jobIds);
    }

    /**
     * Assigns a shipment to an agent. Removes the shipment if it's currently assigned to another agent
     * @param shipmentIds - The IDs of the shipments.
     * @param agentId - The ID of the agent.
     * @returns {boolean} - Returns true if the shipment was successfully assigned.
     */
    async assignShipments(agentId: string, shipmentIds: string[]): Promise<boolean> {
        this.assertArray(shipmentIds, "shipmentIds");
        return new RouteResultShipmentEditor(this.result).assignShipments(agentId, shipmentIds);
    }

    /**
     * Removes a job from the plan.
     * @param jobIds - The IDs of the jobs to remove.
     * @returns {boolean} - Returns true if the job was successfully removed.
     */
    async removeJobs(jobIds: string[]): Promise<boolean> {
        this.assertArray(jobIds, "jobIds");
        return new RouteResultJobEditor(this.result).removeJobs(jobIds);
    }

    /**
     * Removes a shipment from the plan.
     * @param shipmentIds - The IDs of the shipments to remove.
     * @returns {boolean} - Returns true if the shipment was successfully removed.
     */
    async removeShipments(shipmentIds: string[]): Promise<boolean> {
        this.assertArray(shipmentIds, "shipmentIds");
        return new RouteResultShipmentEditor(this.result).removeShipments(shipmentIds);
    }

    /**
     * Adds new jobs to an agent's schedule.
     * @param jobs - An array of job objects to be added.
     * @param agentId - The ID of the agent.
     * @returns {boolean} - Returns true if jobs were successfully added.
     */
    addNewJobs(agentId: string, jobs: Job[]): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        return new RouteResultJobEditor(this.result).addNewJobs(agentId, jobs);
    }

    /**
     * Adds new shipments to an agent's schedule.
     * @param shipments - An array of shipment objects to be added.
     * @param agentId - The ID of the agent.
     * @returns {boolean} - Returns true if shipments were successfully added.
     */
    addNewShipments(agentId: string, shipments: Shipment[]): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        return new RouteResultShipmentEditor(this.result).addNewShipments(agentId, shipments);
    }

    /**
     * Returns the modified result.
     * @returns {RoutePlannerResult} - The modified result object.
     */
    getModifiedResult(): RoutePlannerResult {
        return this.result;
    }

    private assertArray(array: any[], name: string): void {
        if (!Array.isArray(array)) {
            throw new Error("Type error: " + name + " must be an array");
        }
    }
}