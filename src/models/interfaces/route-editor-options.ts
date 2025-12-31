/**
 * Strategy constants for adding or assigning jobs/shipments.
 */
export const REOPTIMIZE = 'reoptimize' as const;
export const INSERT = 'insert' as const;
export const APPEND = 'append' as const;
export const PRESERVE_ORDER = 'preserveOrder' as const;

/**
 * Strategy for adding or assigning jobs/shipments to an agent's route.
 * 
 * - `reoptimize`: Full route re-optimization (default). Finds optimal placement.
 * - `insert`: Insert at best position or specified index without reordering other stops.
 * - `append`: Add to end of agent's route without reordering.
 */
export type AddAssignStrategy = typeof REOPTIMIZE | typeof INSERT | typeof APPEND;

/**
 * Strategy for removing jobs/shipments from an agent's route.
 * 
 * - `reoptimize`: Full route re-optimization after removal (default).
 * - `preserveOrder`: Remove without reordering remaining stops.
 */
export type RemoveStrategy = typeof REOPTIMIZE | typeof PRESERVE_ORDER;

/**
 * Options for assigning or adding jobs/shipments to an agent's route.
 */
export interface AddAssignOptions {
    /**
     * Strategy for adding/assigning items to the route.
     * @default 'reoptimize'
     */
    strategy?: AddAssignStrategy;

    /**
     * Insert at a specific index in the agent's route.
     * Used with strategy: 'insert' or 'append'.
     * Index 0 means insert at the beginning (after start location).
     */
    insertAtIndex?: number;

    /**
     * Insert before the stop with this ID.
     * Takes precedence over insertAtIndex if both are provided.
     */
    beforeId?: string;

    /**
     * Insert after the stop with this ID.
     * Takes precedence over insertAtIndex if both are provided.
     */
    afterId?: string;

    /**
     * Priority for optimization.
     * Higher values indicate higher priority.
     * Used with strategy: 'reoptimize'.
     */
    priority?: number;

    /**
     * Force adding despite constraint violations.
     * When true, violations are added as issues to the result instead of throwing exceptions.
     * @default false
     */
    allowViolations?: boolean;
}

/**
 * Options for removing jobs/shipments from an agent's route.
 */
export interface RemoveOptions {
    /**
     * Strategy for removing items from the route.
     * @default 'reoptimize'
     */
    strategy?: RemoveStrategy;
}
