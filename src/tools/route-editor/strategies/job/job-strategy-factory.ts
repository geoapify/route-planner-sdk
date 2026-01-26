import {AddAssignStrategy, RemoveStrategy, REOPTIMIZE, PRESERVE_ORDER, UnknownStrategy} from "../../../../models";
import { AssignStrategy, RemoveStrategy as IRemoveStrategy } from "../base";
import { JobReoptimizeStrategy } from "./job-reoptimize-strategy";
import { JobPreserveOrderAssignStrategy } from "./job-preserve-order-assign-strategy";
import { JobRemoveReoptimizeStrategy } from "./job-remove-reoptimize-strategy";
import { JobPreserveOrderStrategy } from "./job-preserve-order-strategy";

/**
 * Factory for creating job-related strategies
 */
export class JobStrategyFactory {
    
    private static readonly assignStrategies = new Map<AddAssignStrategy, AssignStrategy>([
        [REOPTIMIZE, new JobReoptimizeStrategy()],
        [PRESERVE_ORDER, new JobPreserveOrderAssignStrategy()],
    ]);

    private static readonly removeStrategies = new Map<RemoveStrategy, IRemoveStrategy>([
        [REOPTIMIZE, new JobRemoveReoptimizeStrategy()],
        [PRESERVE_ORDER, new JobPreserveOrderStrategy()],
    ]);

    static createAssignStrategy(strategy: AddAssignStrategy): AssignStrategy {
        const strategyInstance = this.assignStrategies.get(strategy);
        if (!strategyInstance) {
            throw new UnknownStrategy(`Unknown assign strategy: ${strategy}`, strategy, 'assign');
        }
        return strategyInstance;
    }

    static createRemoveStrategy(strategy: RemoveStrategy): IRemoveStrategy {
        const strategyInstance = this.removeStrategies.get(strategy);
        if (!strategyInstance) {
            throw new UnknownStrategy(`Unknown remove strategy: ${strategy}`, strategy, 'remove');
        }
        return strategyInstance;
    }
}
