import { Shipment, ShipmentData, AddAssignOptions, RemoveOptions, REOPTIMIZE } from "../../models";
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
        return strategy.execute(this.context, agentIndex, shipmentIndexes, options);
    }

    async removeShipments(shipmentIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateShipments(shipmentIndexes);
        
        const strategy = ShipmentStrategyFactory.createRemoveStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this.context, shipmentIndexes, options);
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[], options: AddAssignOptions = {}): Promise<boolean> {
        const shipmentsRaw = shipments.map(s => s.getRaw());
        this.validateAgent(agentIndex);
        this.ensureNewItemsValid(shipmentsRaw, "shipments");
        
        const newShipmentIndexes = this.appendShipmentsToInput(shipmentsRaw);
        
        const strategy = ShipmentStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        return strategy.execute(this.context, agentIndex, newShipmentIndexes, options);
    }

    // ===== Shipment-specific validation =====

    private validateShipments(shipmentIndexes: number[], agentIndex?: number): void {
        this.ensureItemsProvided(shipmentIndexes, "shipments");
        this.ensureItemsUnique(shipmentIndexes, "Shipments");
        
        for (const shipmentIndex of shipmentIndexes) {
            this.validateShipmentAssignment(shipmentIndex, agentIndex);
        }
    }

    private validateShipmentAssignment(shipmentIndex: number, agentIndex?: number): void {
        const shipmentInfo = this.result.getShipmentInfoByIndex(shipmentIndex);
        if (!shipmentInfo) {
            this.validateShipmentExists(shipmentIndex);
        }
        if (agentIndex !== undefined && shipmentInfo?.getAgent().getAgentIndex() === agentIndex) {
            throw new Error(`Shipment with index ${shipmentIndex} already assigned to agent with index ${agentIndex}`);
        }
    }

    private validateShipmentExists(shipmentIndex: number): void {
        const shipmentFound = this.result.getRawData().properties.params.shipments[shipmentIndex];
        if (!shipmentFound) {
            throw new Error(`Shipment with index ${shipmentIndex} not found`);
        }
        const isUnassignedShipment = this.result.getRawData().properties.issues?.unassigned_shipments?.includes(shipmentIndex);
        if (!isUnassignedShipment) {
            throw new Error(`Shipment with index ${shipmentIndex} is invalid`);
        }
    }

    // ===== Shipment-specific helpers =====

    private appendShipmentsToInput(shipmentsRaw: ShipmentData[]): number[] {
        const startIndex = this.result.getRawData().properties.params.shipments.length;
        this.result.getRawData().properties.params.shipments.push(...shipmentsRaw);
        return shipmentsRaw.map((_, i) => startIndex + i);
    }

    private applyPriority(shipmentIndexes: number[], priority?: number): void {
        if (priority === undefined) return;
        for (const shipmentIndex of shipmentIndexes) {
            this.result.getRawData().properties.params.shipments[shipmentIndex].priority = priority;
        }
    }
}
