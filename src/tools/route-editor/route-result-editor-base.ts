import { RoutePlannerResult } from "../../models/entities/route-planner-result";
import { StrategyContext } from "./strategies";

/**
 * Base class for route result editors with shared functionality
 */
export abstract class RouteResultEditorBase {
    protected readonly result: RoutePlannerResult;
    protected readonly context: StrategyContext;

    constructor(result: RoutePlannerResult) {
        this.result = result;
        this.context = new StrategyContext(result);
    }

    protected validateAgent(agentIndex: number): void {
        const agentFound = this.result.getRawData().properties.params.agents[agentIndex];
        if (!agentFound) {
            throw new Error(`Agent with index ${agentIndex} not found`);
        }
    }

    protected ensureItemsProvided(indexes: number[], itemType: string): void {
        if (indexes.length === 0) {
            throw new Error(`No ${itemType} provided`);
        }
    }

    protected ensureItemsUnique(indexes: number[], itemType: string): void {
        if (indexes.length !== new Set(indexes).size) {
            throw new Error(`${itemType} are not unique`);
        }
    }

    protected ensureNewItemsValid<T>(items: T[], itemType: string): void {
        if (items.length === 0) {
            throw new Error(`No ${itemType} provided`);
        }
        if (items.length !== new Set(items).size) {
            throw new Error(`${itemType} are not unique`);
        }
    }
}
