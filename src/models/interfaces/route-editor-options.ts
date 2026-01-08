/**
 * Strategy constants for adding or assigning jobs/shipments.
 * Use these constants instead of string literals for type safety.
 * 
 * @example
 * ```typescript
 * import { REOPTIMIZE, INSERT, APPEND } from '@geoapify/route-planner-sdk';
 * 
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: REOPTIMIZE });
 * ```
 */
export const REOPTIMIZE = 'reoptimize' as const;
export const INSERT = 'insert' as const;
export const APPEND = 'append' as const;
export const PRESERVE_ORDER = 'preserveOrder' as const;

/**
 * Strategy for adding or assigning jobs/shipments to an agent's route.
 * 
 * - `reoptimize`: Full route re-optimization (default). Calls the API to find optimal placement.
 *   Best for finding the most efficient route but involves an API call.
 * - `insert`: Insert at best position or specified index without reordering other stops.
 *   Uses Route Matrix API to find optimal insertion point if no explicit position given.
 * - `append`: Add to end of agent's route without reordering. No API call needed.
 *   Fastest option but may not be optimal.
 */
export type AddAssignStrategy = typeof REOPTIMIZE | typeof INSERT | typeof APPEND;

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
 * // Default behavior - full reoptimization
 * await editor.assignJobs('agent-A', ['job-1']);
 * 
 * // Append to end without reordering
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'append' });
 * 
 * // Insert at optimal position
 * await editor.assignJobs('agent-A', ['job-1'], { strategy: 'insert' });
 * 
 * // Insert at specific position
 * await editor.assignJobs('agent-A', ['job-1'], { 
 *   strategy: 'insert', 
 *   insertAtIndex: 2 
 * });
 * 
 * // Insert after a specific job
 * await editor.assignJobs('agent-A', ['job-2'], { 
 *   strategy: 'insert', 
 *   afterId: 'job-1' 
 * });
 * ```
 */
export interface AddAssignOptions {
    /**
     * Strategy for adding/assigning items to the route.
     * 
     * - `reoptimize`: Full route re-optimization (default)
     * - `insert`: Insert at optimal or specified position
     * - `append`: Add to end of route
     * 
     * @default 'reoptimize'
     */
    strategy?: AddAssignStrategy;

    /**
     * Insert at a specific index in the agent's route.
     * Used with strategy: 'insert'.
     * Index 0 means insert at the beginning (after start location).
     * 
     * @example
     * ```typescript
     * { strategy: 'insert', insertAtIndex: 2 } // Insert at position 2
     * ```
     */
    insertAtIndex?: number;

    /**
     * Insert before the stop with this ID (job ID or shipment ID).
     * Takes precedence over insertAtIndex if both are provided.
     * Used with strategy: 'insert'.
     * 
     * @example
     * ```typescript
     * { strategy: 'insert', beforeId: 'job-3' } // Insert before job-3
     * ```
     */
    beforeId?: string;

    /**
     * Insert after the stop with this ID (job ID or shipment ID).
     * Takes precedence over insertAtIndex if both are provided.
     * Used with strategy: 'insert'.
     * 
     * @example
     * ```typescript
     * { strategy: 'insert', afterId: 'job-1' } // Insert after job-1
     * ```
     */
    afterId?: string;

    /**
     * Priority for optimization.
     * Higher values indicate higher priority.
     * Used with strategy: 'reoptimize' to influence the optimizer.
     * 
     * @example
     * ```typescript
     * { priority: 100 } // High priority job
     * ```
     */
    priority?: number;

    /**
     * When true, constraint violations are added as issues instead of throwing exceptions.
     * When false, violations throw exceptions immediately.
     * @default true
     */
    allowViolations?: boolean;
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
