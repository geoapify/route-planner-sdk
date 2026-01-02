import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { Utils } from "./tools/utils";
import { Job, Shipment, AddAssignOptions, RemoveOptions } from "./models";
import { IndexConverter } from "./helpers/index-converter";

/**
 * Editor for modifying route planner results.
 * 
 * Provides methods to assign, remove, and add jobs/shipments to agent routes.
 * Supports multiple strategies: reoptimize (default), insert, and append.
 * 
 * @example
 * ```typescript
 * import { RoutePlannerResultEditor, APPEND, PRESERVE_ORDER } from '@geoapify/route-planner-sdk';
 * 
 * const editor = new RoutePlannerResultEditor(plannerResult);
 * 
 * // Assign job to agent (with full reoptimization)
 * await editor.assignJobs('agent-A', ['job-1']);
 * 
 * // Append job to end of route (no reoptimization)
 * await editor.assignJobs('agent-A', ['job-2'], { strategy: APPEND });
 * 
 * // Remove job while keeping route order
 * await editor.removeJobs(['job-3'], { strategy: PRESERVE_ORDER });
 * 
 * // Get the modified result
 * const modifiedResult = editor.getModifiedResult();
 * ```
 */
export class RoutePlannerResultEditor {
    private readonly result: RoutePlannerResult;

    /**
     * Creates a new RoutePlannerResultEditor.
     * Note: The editor works on a cloned copy of the result, not the original.
     * 
     * @param result - The route planner result to edit
     */
    constructor(result: RoutePlannerResult) {
        this.result = new RoutePlannerResult(Utils.cloneObject(result.getOptions()),
            Utils.cloneObject(result.getRawData()));
    }

    /**
     * Assigns jobs to an agent. Removes the jobs if they're currently assigned to another agent.
     * 
     * @param agentIdOrIndex - The ID or index of the agent
     * @param jobIndexesOrIds - Array of job IDs or indexes to assign
     * @param options - Assignment options or priority number (for backward compatibility)
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * // Default: full reoptimization
     * await editor.assignJobs('agent-A', ['job-1', 'job-2']);
     * 
     * // With priority (backward compatible)
     * await editor.assignJobs('agent-A', ['job-1'], 100);
     * 
     * // Append to end of route
     * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'append' });
     * 
     * // Insert at optimal position
     * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'insert' });
     * 
     * // Insert after specific job
     * await editor.assignJobs('agent-A', ['job-2'], { 
     *   strategy: 'insert', 
     *   afterId: 'job-1' 
     * });
     * ```
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
     * 
     * @param agentIdOrIndex - The ID or index of the agent
     * @param shipmentIndexesOrIds - Array of shipment IDs or indexes to assign
     * @param options - Assignment options or priority number (for backward compatibility)
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * // Default: full reoptimization
     * await editor.assignShipments('agent-A', ['shipment-1']);
     * 
     * // Append pickup and delivery to end of route
     * await editor.assignShipments('agent-A', ['shipment-1'], { strategy: 'append' });
     * ```
     */
    async assignShipments(agentIdOrIndex: string | number, shipmentIndexesOrIds: number[] | string[], options?: number | AddAssignOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexesOrIds");
        const normalizedOptions = this.normalizeAddAssignOptions(options);
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).assignShipments(agentIndex, shipmentIndexes, normalizedOptions);
    }

    /**
     * Removes jobs from the plan, marking them as unassigned.
     * 
     * @param jobIndexesOrIds - Array of job IDs or indexes to remove
     * @param options - Removal options
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * // Default: reoptimize remaining route
     * await editor.removeJobs(['job-1', 'job-2']);
     * 
     * // Remove without reordering remaining jobs
     * await editor.removeJobs(['job-1'], { strategy: 'preserveOrder' });
     * ```
     */
    async removeJobs(jobIndexesOrIds: number[] | string[], options?: RemoveOptions): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.result.getData(), jobIndexesOrIds);
        return new RouteResultJobEditor(this.result).removeJobs(jobIndexes, this.normalizeRemoveOptions(options));
    }

    /**
     * Removes shipments from the plan, marking them as unassigned.
     * 
     * @param shipmentIndexesOrIds - Array of shipment IDs or indexes to remove
     * @param options - Removal options
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * // Default: reoptimize remaining route
     * await editor.removeShipments(['shipment-1']);
     * 
     * // Remove without reordering remaining shipments
     * await editor.removeShipments(['shipment-1'], { strategy: 'preserveOrder' });
     * ```
     */
    async removeShipments(shipmentIndexesOrIds: number[] | string[], options?: RemoveOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexes");
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.result.getData(), shipmentIndexesOrIds);
        return new RouteResultShipmentEditor(this.result).removeShipments(shipmentIndexes, this.normalizeRemoveOptions(options));
    }

    /**
     * Adds new jobs to an agent's schedule.
     * 
     * @param agentIdOrIndex - The ID or index of the agent
     * @param jobs - Array of Job objects to add
     * @param options - Assignment options
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * const newJob = new Job()
     *   .setId('new-job')
     *   .setLocation(44.5, 40.2)
     *   .setDuration(300);
     * 
     * // Default: reoptimize with new job
     * await editor.addNewJobs('agent-A', [newJob]);
     * 
     * // Append to end of route
     * await editor.addNewJobs('agent-A', [newJob], { strategy: 'append' });
     * ```
     */
    addNewJobs(agentIdOrIndex: string | number, jobs: Job[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultJobEditor(this.result).addNewJobs(agentIndex, jobs, this.normalizeAddAssignOptions(options));
    }

    /**
     * Adds new shipments to an agent's schedule.
     * 
     * @param agentIdOrIndex - The ID or index of the agent
     * @param shipments - Array of Shipment objects to add
     * @param options - Assignment options
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * const newShipment = new Shipment()
     *   .setId('new-shipment')
     *   .setPickup(new ShipmentStep().setLocation(44.5, 40.2).setDuration(120))
     *   .setDelivery(new ShipmentStep().setLocation(44.6, 40.3).setDuration(120));
     * 
     * // Default: reoptimize with new shipment
     * await editor.addNewShipments('agent-A', [newShipment]);
     * ```
     */
    addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        let agentIndex = IndexConverter.convertAgentToIndex(this.result.getData(), agentIdOrIndex, true);
        return new RouteResultShipmentEditor(this.result).addNewShipments(agentIndex, shipments, this.normalizeAddAssignOptions(options));
    }

    /**
     * Returns the modified result.
     * 
     * @returns The modified RoutePlannerResult object
     * 
     * @example
     * ```typescript
     * await editor.assignJobs('agent-A', ['job-1']);
     * const modifiedResult = editor.getModifiedResult();
     * 
     * // Use the modified result
     * console.log(modifiedResult.getAgentSolutions());
     * ```
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