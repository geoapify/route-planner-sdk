/**
 * Strategy constants for adding or assigning jobs/shipments.
 * Use these constants instead of string literals for type safety.
 * 
 * @example
 * ```typescript
 * import { REOPTIMIZE, PRESERVE_ORDER } from '@geoapify/route-planner-sdk';
 * 
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: REOPTIMIZE });
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: PRESERVE_ORDER, append: true });
 * ```
 */
export const REOPTIMIZE = 'reoptimize' as const;
export const PRESERVE_ORDER = 'preserveOrder' as const;

/**
 * Strategy for adding or assigning jobs/shipments to an agent's route.
 * 
 * - `reoptimize`: Full route re-optimization (default). Calls the Route Planner API to find optimal placement.
 *   Best for finding the most efficient route but involves an API call.
 * - `preserveOrder`: Insert without reordering existing stops.
 *   - Without position params: Uses Route Matrix API to find optimal insertion point.
 *   - With afterId/insertAtIndex: Inserts at specified position (no API call).
 *   - With append: true: Appends to end of route (no API call).
 */
export type AddAssignStrategy = typeof REOPTIMIZE | typeof PRESERVE_ORDER;

/**
 * Strategy for removing jobs/shipments from an agent's route.
 * 
 * - `reoptimize`: Full route re-optimization after removal (default). 
 *   Calls the API to find optimal route for remaining stops.
 * - `preserveOrder`: Remove without reordering remaining stops. No API call needed.
 *   Keeps the existing order of stops, simply removing the specified items.
 */
export type RemoveStrategy = typeof REOPTIMIZE | typeof PRESERVE_ORDER;

/**
 * Options for assigning or adding jobs/shipments to an agent's route.
 * 
 * @example
 * ```typescript
 * // Default behavior - full reoptimization (Route Planner API)
 * await editor.assignJobs('agent-A', ['job-1']);
 * 
 * // Find optimal insertion point anywhere (Route Matrix API)
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'preserveOrder' });
 * 
 * // Find optimal position after a specific waypoint (Route Matrix API)
 * await editor.assignJobs('agent-A', ['job-1'], { 
 *   strategy: 'preserveOrder', 
 *   afterWaypointIndex: 1 
 * });
 * 
 * // Insert directly after a specific waypoint (no API call)
 * await editor.assignJobs('agent-A', ['job-1'], { 
 *   strategy: 'preserveOrder', 
 *   afterWaypointIndex: 1,
 *   append: true 
 * });
 * 
 * // Find optimal position after a specific job (Route Matrix API)
 * await editor.assignJobs('agent-A', ['job-2'], { 
 *   strategy: 'preserveOrder', 
 *   afterId: 'job-1' 
 * });
 * 
 * // Insert directly after a specific job (no API call)
 * await editor.assignJobs('agent-A', ['job-2'], { 
 *   strategy: 'preserveOrder', 
 *   afterId: 'job-1',
 *   append: true 
 * });
 * 
 * // Append to end of route (no API call)
 * await editor.assignJobs('agent-A', ['job-1'], { 
 *   strategy: 'preserveOrder', 
 *   append: true
 * });
 * ```
 */
export interface AddAssignOptions {
    /**
     * Strategy for adding/assigning items to the route.
     * 
     * - `reoptimize`: Full route re-optimization (default). Uses Route Planner API.
     * - `preserveOrder`: Insert without reordering existing stops.
     *   Uses Route Matrix API if no position specified, otherwise local operation.
     * 
     * @default 'reoptimize'
     */
    strategy?: AddAssignStrategy;

    /**
     * Strategy for removing items from the source agent when moving between agents.
     * Only applicable when the items are currently assigned to another agent.
     * 
     * - `preserveOrder`: Remove without reordering source agent's remaining stops (default, fast)
     * - `reoptimize`: Reoptimize source agent's route after removal (slower, but optimal)
     * 
     * @default 'preserveOrder'
     */
    removeStrategy?: RemoveStrategy;


    /**
     * Insert after the waypoint at this index in the agent's route.
     * Used with strategy: 'preserveOrder'.
     * Waypoint index 0 is the start location, 1 is the first job/shipment stop, etc.
     * 
     * Behavior depends on the `append` flag:
     * - `append: true`: Insert directly after this waypoint (no API call)
     * - `append: false` or undefined: Find optimal position after this waypoint (Route Matrix API)
     * 
     * Note: Cannot use afterWaypointIndex for the last waypoint (end location).
     * Use append: true without position params to append to the end of the route.
     * 
     * @example
     * ```typescript
     * // Find optimal position after first stop (Route Matrix API)
     * { strategy: 'preserveOrder', afterWaypointIndex: 1 }
     * 
     * // Insert directly after start (no API call)
     * { strategy: 'preserveOrder', afterWaypointIndex: 0, append: true }
     * ```
     */
    afterWaypointIndex?: number;

    /**
     * Insert after the stop with this ID (job ID or shipment ID).
     * Takes precedence over waypoint index options if both are provided.
     * Used with strategy: 'preserveOrder'.
     * 
     * Behavior depends on the `append` flag:
     * - `append: true`: Insert directly after this stop (no API call)
     * - `append: false` or undefined: Find optimal position after this stop (Route Matrix API)
     * 
     * @example
     * ```typescript
     * // Find optimal position after job-1 (Route Matrix API)
     * { strategy: 'preserveOrder', afterId: 'job-1' }
     * 
     * // Insert directly after job-1 (no API call)
     * { strategy: 'preserveOrder', afterId: 'job-1', append: true }
     * ```
     */
    afterId?: string;

    /**
     * Controls insertion behavior.
     * Used with strategy: 'preserveOrder'.
     * 
     * When used alone (no position params):
     * - `true`: Append to the end of route (no API call)
     * - `false` or undefined: Find optimal position anywhere (Route Matrix API)
     * 
     * When used with afterId or afterWaypointIndex:
     * - `true`: Insert directly after the specified position (no API call)
     * - `false` or undefined: Find optimal position after the specified position (Route Matrix API)
     * 
     * @example
     * ```typescript
     * // Append to end (no API call)
     * { strategy: 'preserveOrder', append: true }
     * 
     * // Insert directly after job-1 (no API call)
     * { strategy: 'preserveOrder', afterId: 'job-1', append: true }
     * 
     * // Find optimal position after job-1 (Route Matrix API)
     * { strategy: 'preserveOrder', afterId: 'job-1' }
     * ```
     */
    append?: boolean;

}

/**
 * Options for removing jobs/shipments from an agent's route.
 * 
 * @example
 * ```typescript
 * // Default behavior - full reoptimization after removal
 * await editor.removeJobs(['job-1']);
 * 
 * // Remove without reordering remaining stops
 * await editor.removeJobs(['job-1'], { strategy: 'preserveOrder' });
 * ```
 */
export interface RemoveOptions {
    /**
     * Strategy for removing items from the route.
     * 
     * - `reoptimize`: Full route re-optimization after removal (default)
     * - `preserveOrder`: Remove without reordering remaining stops
     * 
     * @default 'reoptimize'
     */
    strategy?: RemoveStrategy;
}

export interface ReoptimizeOptions {
    agentIdOrIndex?: string | number;
    includeUnassigned?: boolean;
    allowViolations?: boolean;
}
