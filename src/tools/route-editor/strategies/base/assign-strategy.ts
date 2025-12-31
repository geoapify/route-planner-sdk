import { AddAssignOptions } from "../../../../models";
import { StrategyContext } from "./strategy-context";

/**
 * Base interface for assign/add strategies
 */
export interface AssignStrategy {
    execute(
        context: StrategyContext,
        agentIndex: number,
        itemIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean>;
}

