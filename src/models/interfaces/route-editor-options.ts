export const REOPTIMIZE = 'reoptimize' as const;
export const PRESERVE_ORDER = 'preserveOrder' as const;

export type AddAssignStrategy = typeof REOPTIMIZE | typeof PRESERVE_ORDER;

export type RemoveStrategy = typeof REOPTIMIZE | typeof PRESERVE_ORDER;

export interface AddAssignOptions {
    strategy?: AddAssignStrategy;
    removeStrategy?: RemoveStrategy;
    afterWaypointIndex?: number;
    afterId?: string;
    append?: boolean;
}

export interface RemoveOptions {
    strategy?: RemoveStrategy;
}

export interface ReoptimizeOptions {
    includeUnassigned?: boolean;
    allowViolations?: boolean;
}
