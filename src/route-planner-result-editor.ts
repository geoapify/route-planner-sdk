import { RoutePlannerResult } from "./models/entities/route-planner-result";
import { RouteResultJobEditor } from "./tools/route-editor/route-result-job-editor";
import { RouteResultShipmentEditor } from "./tools/route-editor/route-result-shipment-editor";
import { AgentReoptimizeHelper, AgentTimeOffsetHelper, WaypointMoveHelper } from "./tools/route-editor/helpers";
import { InsertPositionResolver } from "./tools/route-editor/strategies/preserve-order/utils/insert-position-resolver";
import { Utils } from "./tools/utils";
import { Job, Shipment, AddAssignOptions, RemoveOptions, ReoptimizeOptions, RoutingOptions, RoutePlannerResultResponseDataExtended, InvalidInsertionPosition, InvalidParameterType } from "./models";
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
 * await editor.assignJobs('agent-A', ['job-2'], { strategy: PRESERVE_ORDER, append: true });
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
     * @param options - Assignment options
     * @returns Promise resolving to true if successful
     * 
     * @example
     * ```typescript
     * // Default: full reoptimization (Route Planner API)
     * await editor.assignJobs('agent-A', ['job-1', 'job-2']);
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
     *   append: true
     * });
     * ```
     */
    async assignJobs(agentIdOrIndex: string | number, jobIndexesOrIds: number[] | string[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(jobIndexesOrIds, "jobIndexesOrIds");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        const normalizedOptions = this.normalizeAddAssignOptions(agentIndex, options);
        let jobIndexes = IndexConverter.convertJobsToIndexes(this.rawData, jobIndexesOrIds);
        return this.getJobEditor().assignJobs(agentIndex, jobIndexes, normalizedOptions)
    }

    /**
     * Assigns shipments to an agent. Removes the shipments if they're currently assigned to another agent.
     * 
     * @param agentIdOrIndex - The ID or index of the agent
     * @param shipmentIndexesOrIds - Array of shipment IDs or indexes to assign
     * @param options - Assignment options
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
     *   append: true
     * });
     * ```
     */
    async assignShipments(agentIdOrIndex: string | number, shipmentIndexesOrIds: number[] | string[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(shipmentIndexesOrIds, "shipmentIndexesOrIds");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        const normalizedOptions = this.normalizeAddAssignOptions(agentIndex, options);
        let shipmentIndexes = IndexConverter.convertShipmentsToIndexes(this.rawData, shipmentIndexesOrIds);
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
     * await editor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', append: true });
     * ```
     */
    addNewJobs(agentIdOrIndex: string | number, jobs: Job[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(jobs, "jobs");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        const normalizedOptions = this.normalizeAddAssignOptions(agentIndex, options);

        return this.getJobEditor().addNewJobs(agentIndex, jobs, normalizedOptions);
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
     *   append: true
     * });
     * ```
     */
    addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean> {
        this.assertArray(shipments, "shipments");
        let agentIndex = IndexConverter.convertAgentToIndex(this.rawData, agentIdOrIndex, true);
        const normalizedOptions = this.normalizeAddAssignOptions(agentIndex, options);
        /* ToDo No need to create an object here, use functions */
        return this.getShipmentEditor().addNewShipments(agentIndex, shipments, normalizedOptions);
    }

    getModifiedResult(): RoutePlannerResult {
        return new RoutePlannerResult(this.callOptions, this.rawData);
    }

    async reoptimizeAgentPlan(options: ReoptimizeOptions): Promise<boolean> {
        return AgentReoptimizeHelper.execute(this.getJobEditor(), options);
    }

    addTimeOffsetAfterWaypoint(agentIdOrIndex: string | number, waypointIndex: number, offsetSeconds: number): void {
        return AgentTimeOffsetHelper.execute(this.getJobEditor(), agentIdOrIndex, waypointIndex, offsetSeconds);
    }

    async moveWaypoint(agentIdOrIndex: string | number, fromWaypointIndex: number, toWaypointIndex: number): Promise<void> {
        return WaypointMoveHelper.execute(this.getJobEditor(), agentIdOrIndex, fromWaypointIndex, toWaypointIndex);
    }

    private assertArray(array: any[], name: string): void {
        if (!Array.isArray(array)) {
            throw new InvalidParameterType(name + " must be an array", name);
        }
    }

    private normalizeAddAssignOptions(agentIndex: number, options?: AddAssignOptions): AddAssignOptions {
        const normalizedOptions: AddAssignOptions = { ...(options ?? {}) };

        if (normalizedOptions.afterId && normalizedOptions.afterId !== "") {
            const insertPosition = this.resolveInsertPosition(agentIndex, normalizedOptions.afterId);
            normalizedOptions.afterWaypointIndex = insertPosition;
            delete normalizedOptions.afterId;
        }

        this.validateAfterWaypointIndex(agentIndex, normalizedOptions);

        return normalizedOptions;
    }

    private resolveInsertPosition(agentIndex: number, afterId: string): number {
        const waypoints = this.getJobEditor().getAgentWaypoints(agentIndex);
        let lastMatchingIndex = -1;

        for (let i = 0; i < waypoints.length; i++) {
            const hasMatchedAction = waypoints[i].actions.some(
                (action) => action.job_id === afterId || action.shipment_id === afterId
            );
            if (hasMatchedAction) {
                lastMatchingIndex = i;
            }
        }

        if (lastMatchingIndex === -1) {
            throw new InvalidInsertionPosition(
                `Shipment or Job '${afterId}' not found in agent ${agentIndex} route`,
                agentIndex,
                undefined,
                afterId
            );
        }

        return lastMatchingIndex;
    }

    private validateAfterWaypointIndex(agentIndex: number, options: AddAssignOptions): void {
        if (options.afterWaypointIndex === undefined) {
            return;
        }
        InsertPositionResolver.validateAfterWaypointIndex(this.getJobEditor(), agentIndex, options.afterWaypointIndex);
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
