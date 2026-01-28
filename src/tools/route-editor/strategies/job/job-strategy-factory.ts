import {AddAssignStrategy, RemoveStrategy, REOPTIMIZE, PRESERVE_ORDER, UnknownStrategy} from "../../../../models";
import { AssignStrategy, RemoveStrategy as IRemoveStrategy } from "../base";
import { JobAssignReoptimizeStrategy } from "./job-assign-reoptimize-strategy";
import { JobAssignPreserveOrderStrategy } from "./job-assign-preserve-order-strategy";
import { JobRemoveReoptimizeStrategy } from "./job-remove-reoptimize-strategy";
import { JobRemovePreserveOrderStrategy } from "./job-remove-preserve-order-strategy";

/**
 * Factory for creating job-related strategies
 */
export class JobStrategyFactory {
    
    private static readonly assignStrategies = new Map<AddAssignStrategy, AssignStrategy>([
        [REOPTIMIZE, new JobAssignReoptimizeStrategy()],
        [PRESERVE_ORDER, new JobAssignPreserveOrderStrategy()],
    ]);

    private static readonly removeStrategies = new Map<RemoveStrategy, IRemoveStrategy>([
        [REOPTIMIZE, new JobRemoveReoptimizeStrategy()],
        [PRESERVE_ORDER, new JobRemovePreserveOrderStrategy()],
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
