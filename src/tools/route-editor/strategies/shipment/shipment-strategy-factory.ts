import { AddAssignStrategy, RemoveStrategy, REOPTIMIZE, APPEND, INSERT, PRESERVE_ORDER } from "../../../../models";
import { AssignStrategy, RemoveStrategy as IRemoveStrategy } from "../base";
import { ShipmentReoptimizeStrategy } from "./shipment-reoptimize-strategy";
import { ShipmentAppendStrategy } from "./shipment-append-strategy";
import { ShipmentInsertStrategy } from "./shipment-insert-strategy";
import { ShipmentRemoveReoptimizeStrategy } from "./shipment-remove-reoptimize-strategy";
import { ShipmentPreserveOrderStrategy } from "./shipment-preserve-order-strategy";

/**
 * Factory for creating shipment-related strategies
 */
export class ShipmentStrategyFactory {
    
    private static readonly assignStrategies = new Map<AddAssignStrategy, AssignStrategy>([
        [REOPTIMIZE, new ShipmentReoptimizeStrategy()],
        [APPEND, new ShipmentAppendStrategy()],
        [INSERT, new ShipmentInsertStrategy()],
    ]);

    private static readonly removeStrategies = new Map<RemoveStrategy, IRemoveStrategy>([
        [REOPTIMIZE, new ShipmentRemoveReoptimizeStrategy()],
        [PRESERVE_ORDER, new ShipmentPreserveOrderStrategy()],
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

