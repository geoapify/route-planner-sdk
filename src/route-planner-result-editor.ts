import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { Utils } from "./tools/utils";
import { Job, Shipment, AddAssignOptions, RemoveOptions } from "./models";
import { IndexConverter } from "./helpers/index-converter";

export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    constructor(result: RoutePlannerResult) {
        this.result = new RoutePlannerResult(Utils.cloneObject(result.getOptions()),
            Utils.cloneObject(result.getRawData()));
    }

    /**
     * Assigns jobs to an agent. Removes the jobs if they're currently assigned to another agent.
     * @param agentIdOrIndex - The index/id of the agent.
     * @param jobIndexesOrIds - Indexes/ids of the jobs.
     * @param options - Options for the assignment or priority number (backward compatible).
     * @returns {boolean} - Returns true if the jobs were successfully assigned.
     */
    async assignJobs(agentIdOrIndex: string | number, jobIndexesOrIds: number[] | string[], options?: number | AddAssignOptions): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        const normalizedOptions = this.normalizeAddAssignOptions(options);
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.result.getData(), jobIndexesOrIds);
        return new RouteResultJobEditor(this.result).assignJobs(agentIndex, jobIndexes, normalizedOptions);
    }

    /**
     * Assigns shipments to an agent. Removes the shipments if they're currently assigned to another agent.
     * @param agentIdOrIndex - The index/id of the agent.
     * @param shipmentIndexesOrIds - The indexes/ids of the shipments.
     * @param options - Options for the assignment or priority number (backward compatible).
     * @returns {boolean} - Returns true if the shipments were successfully assigned.
     */
    async assignShipments(agentIdOrIndex: string | number, shipmentIndexesOrIds: number[] | string[], options?: number | AddAssignOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexesOrIds");
        const normalizedOptions = this.normalizeAddAssignOptions(options);
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).assignShipments(agentIndex, shipmentIndexes, normalizedOptions);
    }

    /**
     * Removes jobs from the plan.
     * @param jobIndexesOrIds - The indexes/ids of the jobs to remove.
     * @param options - Options for removal.
     * @returns {boolean} - Returns true if the jobs were successfully removed.
     */
    async removeJobs(jobIndexesOrIds: number[] | string[], options?: RemoveOptions): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.result.getData(), jobIndexesOrIds);
        return new RouteResultJobEditor(this.result).removeJobs(jobIndexes, this.normalizeRemoveOptions(options));
    }

    /**
     * Removes shipments from the plan.
     * @param shipmentIndexesOrIds - The indexes/ids of the shipments to remove.
     * @param options - Options for removal.
     * @returns {boolean} - Returns true if the shipments were successfully removed.
     */
    async removeShipments(shipmentIndexesOrIds: number[] | string[], options?: RemoveOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexes");
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        return new RouteResultShipmentEditor(this.result).removeShipments(shipmentIndexes, this.normalizeRemoveOptions(options));
    }

    /**
     * Adds new jobs to an agent's schedule.
     * @param agentIdOrIndex - The index/id of the agent.
     * @param jobs - An array of job objects to be added.
     * @param options - Options for adding jobs.
     * @returns {boolean} - Returns true if jobs were successfully added.
     */
    addNewJobs(agentIdOrIndex: string | number, jobs: Job[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultJobEditor(this.result).addNewJobs(agentIndex, jobs, this.normalizeAddAssignOptions(options));
    }

    /**
     * Adds new shipments to an agent's schedule.
     * @param agentIdOrIndex - The index/id of the agent.
     * @param shipments - An array of shipment objects to be added.
     * @param options - Options for adding shipments.
     * @returns {boolean} - Returns true if shipments were successfully added.
     */
    addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).addNewShipments(agentIndex, shipments, this.normalizeAddAssignOptions(options));
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

    /**
     * Normalizes options parameter for backward compatibility.
     * If a number is passed, it's treated as priority (old API).
     */
    private normalizeAddAssignOptions(options?: number | AddAssignOptions): AddAssignOptions {
        if (typeof options === 'number') {
            return { priority: options };
        }
        return options ?? {};
    }

    private normalizeRemoveOptions(options?: RemoveOptions): RemoveOptions {
        return options ?? {};
    }
}