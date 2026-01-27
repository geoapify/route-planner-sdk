import {
    Shipment,
    ShipmentData,
    AddAssignOptions,
    RemoveOptions,
    REOPTIMIZE,
    ItemAlreadyAssigned, ShipmentNotFound
} from "../../models";
import { ShipmentStrategyFactory } from "./strategies";
import { RouteResultEditorBase } from "./route-result-editor-base";

/**
 * Editor for managing shipments in a route planner result
 */
export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentIndex: number, shipmentIndexes: number[], options: AddAssignOptions = {}): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateShipments(shipmentIndexes, agentIndex);
        this.applyPriority(shipmentIndexes, options.priority);
        
        const strategy = ShipmentStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, agentIndex, shipmentIndexes, options);
    }

    async removeShipments(shipmentIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateShipments(shipmentIndexes);
        
        const strategy = ShipmentStrategyFactory.createRemoveStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, shipmentIndexes, options);
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[], options: AddAssignOptions = {}): Promise<boolean> {
        const shipmentsRaw = shipments.map(s => s.getRaw());
        this.validateAgent(agentIndex);
        this.ensureNewItemsValid(shipmentsRaw, "shipments");
        
        const newShipmentIndexes = this.appendShipmentsToInput(shipmentsRaw);
        
        const strategy = ShipmentStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this, agentIndex, newShipmentIndexes, options);
    }

    private validateShipments(shipmentIndexes: number[], agentIndex?: number): void {
        this.ensureItemsProvided(shipmentIndexes, "shipments");
        this.ensureItemsUnique(shipmentIndexes, "shipments");
        
        for (const shipmentIndex of shipmentIndexes) {
            this.validateShipmentAssignment(shipmentIndex, agentIndex);
        }
    }

    private validateShipmentAssignment(shipmentIndex: number, agentIndex?: number): void {
        const realAgentIndexForShipment = this.getAgentIndexForShipment(shipmentIndex);
        if (realAgentIndexForShipment === undefined)  {
            this.validateShipmentExists(shipmentIndex);
        }
        if (agentIndex !== undefined && realAgentIndexForShipment === agentIndex) {
            throw new ItemAlreadyAssigned(
                `Shipment with index ${shipmentIndex} already assigned to agent with index ${agentIndex}`,
                'shipment', shipmentIndex, agentIndex
            );
        }
    }

    private validateShipmentExists(shipmentIndex: number): void {
        const shipmentFound = this.rawData.properties.params.shipments[shipmentIndex];
        if (!shipmentFound) {
            throw new ShipmentNotFound(`Shipment with index ${shipmentIndex} not found`, shipmentIndex);
        }
    }

    private appendShipmentsToInput(shipmentsRaw: ShipmentData[]): number[] {
        const params = this.rawData.properties.params;
        if (!params.shipments) {
            params.shipments = [];
        }
        const startIndex = params.shipments.length;
        params.shipments.push(...shipmentsRaw);
        return shipmentsRaw.map((_, i) => startIndex + i);
    }

    private applyPriority(shipmentIndexes: number[], priority?: number): void {
        if (priority === undefined) return;
        for (const shipmentIndex of shipmentIndexes) {
            this.rawData.properties.params.shipments[shipmentIndex].priority = priority;
        }
    }
}
