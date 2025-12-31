import { RemoveOptions } from "../../../../models";
import { StrategyContext } from "./strategy-context";

/**
 * Base interface for remove strategies
 */
export interface RemoveStrategy {
    execute(
        context: StrategyContext,
        itemIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean>;
}

