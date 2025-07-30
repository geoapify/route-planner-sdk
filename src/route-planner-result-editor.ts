import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { Utils } from "./tools/utils";
import { Job, Shipment } from "./models";
import { IndexConverter } from "./helpers/index-converter";

export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = new RoutePlannerResult(Utils.cloneObject(result.getOptions()),
            Utils.cloneObject(result.getRawData()));
    }

    /**
     * Assigns a job to an agent. Removes the job if it's currently assigned to another agent
     * @param agentIdOrIndex - The index/id of the agent.
     * @param jobIndexesOrIds - Indexes/ids of the jobs.
     * @param newPriority - The new priority of the job.
     * @returns {boolean} - Returns true if the job was successfully assigned.
     */
    async assignJobs(agentIdOrIndex: string | number, jobIndexesOrIds: number[] | string[], newPriority?: number): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.result.getData(), jobIndexesOrIds);
        return new RouteResultJobEditor(this.result).assignJobs(agentIndex, jobIndexes, newPriority);
    }

    /**
     * Assigns a shipment to an agent. Removes the shipment if it's currently assigned to another agent
     * @param shipmentIndexesOrIds - The indexes/ids of the shipments.
     * @param agentIdOrIndex - The index/id of the agent.
     * @param newPriority - The new priority of the shipment.
     * @returns {boolean} - Returns true if the shipment was successfully assigned.
     */
    async assignShipments(agentIdOrIndex: string | number, shipmentIndexesOrIds: number[] | string[], newPriority?: number): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexesOrIds");
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).assignShipments(agentIndex, shipmentIndexes, newPriority);
    }

    /**
     * Removes a job from the plan.
     * @param jobIndexesOrIds - The indexes/ids of the jobs to remove.
     * @returns {boolean} - Returns true if the job was successfully removed.
     */
    async removeJobs(jobIndexesOrIds: number[] | string[]): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.result.getData(), jobIndexesOrIds);
        return new RouteResultJobEditor(this.result).removeJobs(jobIndexes);
    }

    /**
     * Removes a shipment from the plan.
     * @param shipmentIndexesOrIds - The indexes/ids of the shipments to remove.
     * @returns {boolean} - Returns true if the shipment was successfully removed.
     */
    async removeShipments(shipmentIndexesOrIds: number[] | string[]): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexes");
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        return new RouteResultShipmentEditor(this.result).removeShipments(shipmentIndexes);
    }

    /**
     * Adds new jobs to an agent's schedule.
     * @param jobs - An array of job objects to be added.
     * @param agentIdOrIndex - The index/id of the agent.
     * @returns {boolean} - Returns true if jobs were successfully added.
     */
    addNewJobs(agentIdOrIndex: string | number, jobs: Job[]): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultJobEditor(this.result).addNewJobs(agentIndex, jobs);
    }

    /**
     * Adds new shipments to an agent's schedule.
     * @param shipments - An array of shipment objects to be added.
     * @param agentIdOrIndex - The index/id of the agent.
     * @returns {boolean} - Returns true if shipments were successfully added.
     */
    addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[]): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).addNewShipments(agentIndex, shipments);
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