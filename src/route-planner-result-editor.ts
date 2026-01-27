import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { Utils } from "./tools/utils";
import { Job, Shipment, AddAssignOptions, RemoveOptions, RoutingOptions, RoutePlannerResultResponseDataExtended, InvalidParameterType } from "./models";
import { IndexConverter } from "./helpers/index-converter";
import { RoutePlannerCallOptions } from "./models/interfaces/route-planner-call-options";

/**
 * Editor for modifying route planner results.
 * 
 * Provides methods to assign, remove, and add jobs/shipments to agent routes.
 * Supports two strategies: reoptimize (default) and preserveOrder.
 * 
 * @example
 * ```typescript
 * import { RoutePlannerResultEditor, PRESERVE_ORDER, REOPTIMIZE } from '@geoapify/route-planner-sdk';
 * 
 * const editor = new RoutePlannerResultEditor(plannerResult);
 * 
 * // Assign job to agent (with full reoptimization)
 * await editor.assignJobs('agent-A', ['job-1']);
 * 
 * // Find optimal insertion point without reordering (Route Matrix API)
 * await editor.assignJobs('agent-A', ['job-2'], { strategy: PRESERVE_ORDER });
 * 
 * // Append job to end of route (no API call)
 * await editor.assignJobs('agent-A', ['job-2'], { strategy: PRESERVE_ORDER, appendToEnd: true });
 * 
 * // Remove job while keeping route order
 * await editor.removeJobs(['job-3'], { strategy: PRESERVE_ORDER });
 * 
 * // Get the modified result
 * const modifiedResult = editor.getModifiedResult();
 * ```
 */
export class RoutePlannerResultEditor {
    private rawData: RoutePlannerResultResponseDataExtended;
    private callOptions: RoutePlannerCallOptions;
    private routingOptions: RoutingOptions;

    private jobEditor: RouteResultJobEditor;
    private shipmentEditor: RouteResultShipmentEditor;

    /**
     * Creates a new RoutePlannerResultEditor.
     * Note: The editor works on a cloned copy of the result, not the original.
     * 
     * @param result - The route planner result to edit
     */
    constructor(result: RoutePlannerResult) {
        this.rawData = Utils.cloneObject(result.getRaw());
        this.callOptions = result.getCallOptions();
        this.routingOptions = result.getRoutingOptions();
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
     * // Default: full reoptimization (Route Planner API)
     * await editor.assignJobs('agent-A', ['job-1', 'job-2']);
     * 
     * // With priority (backward compatible)
     * await editor.assignJobs('agent-A', ['job-1'], 100);
     * 
     * // Find optimal insertion point (Route Matrix API)
     * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'preserveOrder' });
     * 
     * // Insert at specific position (no API call)
     * await editor.assignJobs('agent-A', ['job-2'], { 
     *   strategy: 'preserveOrder', 
     *   afterId: 'job-1' 
     * });
     * 
     * // Append to end of route (no API call)
     * await editor.assignJobs('agent-A', ['job-1'], { 
     *   strategy: 'preserveOrder', 
     *   appendToEnd: true 
     * });
     * ```
     */
    async assignJobs(agentIdOrIndex: string | number, jobIndexesOrIds: number[] | string[], options?: number | AddAssignOptions): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        const normalizedOptions = this.normalizeAddAssignOptions(options);
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.rawData, jobIndexesOrIds);
        return this.getJobEditor().assignJobs(agentIndex, jobIndexes, normalizedOptions)
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
     * // Default: full reoptimization (Route Planner API)
     * await editor.assignShipments('agent-A', ['shipment-1']);
     * 
     * // Find optimal insertion point (Route Matrix API)
     * await editor.assignShipments('agent-A', ['shipment-1'], { strategy: 'preserveOrder' });
     * 
     * // Append pickup and delivery to end of route (no API call)
     * await editor.assignShipments('agent-A', ['shipment-1'], { 
     *   strategy: 'preserveOrder', 
     *   appendToEnd: true 
     * });
     * ```
     */
    async assignShipments(agentIdOrIndex: string | number, shipmentIndexesOrIds: number[] | string[], options?: number | AddAssignOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexesOrIds");
        const normalizedOptions = this.normalizeAddAssignOptions(options);
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.rawData, shipmentIndexesOrIds);
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        return this.getShipmentEditor().assignShipments(agentIndex, shipmentIndexes, normalizedOptions);
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
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.rawData, jobIndexesOrIds);
        return this.getJobEditor().removeJobs(jobIndexes, this.normalizeRemoveOptions(options));
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
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.rawData, shipmentIndexesOrIds);
        return this.getShipmentEditor().removeShipments(shipmentIndexes, this.normalizeRemoveOptions(options));
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
     * // Default: reoptimize with new job (Route Planner API)
     * await editor.addNewJobs('agent-A', [newJob]);
     * 
     * // Find optimal insertion point (Route Matrix API)
     * await editor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder' });
     * 
     * // Append to end of route (no API call)
     * await editor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', appendToEnd: true });
     * ```
     */
    addNewJobs(agentIdOrIndex: string | number, jobs: Job[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        
        return this.getJobEditor().addNewJobs(agentIndex, jobs, this.normalizeAddAssignOptions(options));
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
     * // Default: reoptimize with new shipment (Route Planner API)
     * await editor.addNewShipments('agent-A', [newShipment]);
     * 
     * // Find optimal insertion point (Route Matrix API)
     * await editor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder' });
     * 
     * // Append to end of route (no API call)
     * await editor.addNewShipments('agent-A', [newShipment], { 
     *   strategy: 'preserveOrder', 
     *   appendToEnd: true 
     * });
     * ```
     */
    addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        /* ToDo No need to create an object here, use functions */
        return this.getShipmentEditor().addNewShipments(agentIndex, shipments, this.normalizeAddAssignOptions(options));
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
        return new RoutePlannerResult(this.callOptions, this.rawData);
    }

    private assertArray(array: any[], name: string): void {
        if (!Array.isArray(array)) {
            throw new InvalidParameterType(name + " must be an array", name);
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

    private getJobEditor() {
        if (!this.jobEditor) {
            this.jobEditor = new RouteResultJobEditor(this.rawData, this.callOptions, this.routingOptions);
        }

        return this.jobEditor;
    }

    private getShipmentEditor() {
        if (!this.shipmentEditor) {
            this.shipmentEditor = new RouteResultShipmentEditor(this.rawData, this.callOptions, this.routingOptions);
        }

        return this.shipmentEditor;
    }
}
