import { AddAssignStrategy, RemoveStrategy, REOPTIMIZE, APPEND, INSERT, PRESERVE_ORDER } from "../../../../models";
import { AssignStrategy, RemoveStrategy as IRemoveStrategy } from "../base";
import { JobReoptimizeStrategy } from "./job-reoptimize-strategy";
import { JobAppendStrategy } from "./job-append-strategy";
import { JobInsertStrategy } from "./job-insert-strategy";
import { JobRemoveReoptimizeStrategy } from "./job-remove-reoptimize-strategy";
import { JobPreserveOrderStrategy } from "./job-preserve-order-strategy";

/**
 * Factory for creating job-related strategies
 */
export class JobStrategyFactory {
    
    private static readonly assignStrategies = new Map<AddAssignStrategy, AssignStrategy>([
        [REOPTIMIZE, new JobReoptimizeStrategy()],
        [APPEND, new JobAppendStrategy()],
        [INSERT, new JobInsertStrategy()],
    ]);

    private static readonly removeStrategies = new Map<RemoveStrategy, IRemoveStrategy>([
        [REOPTIMIZE, new JobRemoveReoptimizeStrategy()],
        [PRESERVE_ORDER, new JobPreserveOrderStrategy()],
    ]);

    static createAssignStrategy(strategy: AddAssignStrategy): AssignStrategy {
        const strategyInstance = this.assignStrategies.get(strategy);
        if (!strategyInstance) {
            throw new Error(`Unknown assign strategy: ${strategy}`);
        }
        return strategyInstance;
    }

    static createRemoveStrategy(strategy: RemoveStrategy): IRemoveStrategy {
        const strategyInstance = this.removeStrategies.get(strategy);
        if (!strategyInstance) {
            throw new Error(`Unknown remove strategy: ${strategy}`);
        }
        return strategyInstance;
    }
}

