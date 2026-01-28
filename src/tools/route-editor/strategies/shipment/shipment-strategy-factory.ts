import {AddAssignStrategy, RemoveStrategy, REOPTIMIZE, PRESERVE_ORDER, UnknownStrategy} from "../../../../models";
import { AssignStrategy, RemoveStrategy as IRemoveStrategy } from "../base";
import { ShipmentAssignReoptimizeStrategy } from "./shipment-assign-reoptimize-strategy";
import { ShipmentAssignPreserveOrderStrategy } from "./shipment-assign-preserve-order-strategy";
import { ShipmentRemoveReoptimizeStrategy } from "./shipment-remove-reoptimize-strategy";
import { ShipmentRemovePreserveOrderStrategy } from "./shipment-remove-preserve-order-strategy";

/**
 * Factory for creating shipment-related strategies
 */
export class ShipmentStrategyFactory {
    
    private static readonly assignStrategies = new Map<AddAssignStrategy, AssignStrategy>([
        [REOPTIMIZE, new ShipmentAssignReoptimizeStrategy()],
        [PRESERVE_ORDER, new ShipmentAssignPreserveOrderStrategy()],
    ]);

    private static readonly removeStrategies = new Map<RemoveStrategy, IRemoveStrategy>([
        [REOPTIMIZE, new ShipmentRemoveReoptimizeStrategy()],
        [PRESERVE_ORDER, new ShipmentRemovePreserveOrderStrategy()],
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
