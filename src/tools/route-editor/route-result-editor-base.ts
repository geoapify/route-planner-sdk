import { StrategyContext } from "./strategies";
import { RoutePlannerResultResponseData, RoutingOptions } from "../../models";
import { RoutePlannerCallOptions } from "../../models/interfaces/route-planner-call-options";

/**
 * Base class for route result editors with shared functionality
 */
export abstract class RouteResultEditorBase {

    protected context: StrategyContext;

    constructor(protected readonly rawData: RoutePlannerResultResponseData, protected readonly callOptions: RoutePlannerCallOptions, protected readonly routingOptions: RoutingOptions) {
        this.rawData = rawData;
        this.context = new StrategyContext(rawData, callOptions, routingOptions);
    }

    protected validateAgent(agentIndex: number): void {
        const agentFound = this.rawData.properties.params.agents[agentIndex];
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
            const capitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            throw new Error(`${capitalized} are not unique`);
        }
    }

    protected ensureNewItemsValid<T>(items: T[], itemType: string): void {
        if (items.length === 0) {
            throw new Error(`No ${itemType} provided`);
        }
        if (items.length !== new Set(items).size) {
            const capitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            throw new Error(`${capitalized} are not unique`);
        }
    }
}
