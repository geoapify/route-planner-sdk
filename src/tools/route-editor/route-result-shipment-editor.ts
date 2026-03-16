import {
    Shipment,
    ShipmentData,
    ShipmentStepData,
    AddAssignOptions,
    RemoveOptions,
    REOPTIMIZE,
    ItemAlreadyAssigned, ShipmentNotFound, InvalidParameter
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
        
        const strategy = ShipmentStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        const result = await strategy.execute(this, agentIndex, shipmentIndexes, options);
        this.updateIssues();
        return result;
    }

    async removeShipments(shipmentIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateShipments(shipmentIndexes);
        
        const strategy = ShipmentStrategyFactory.createRemoveStrategy(options.strategy ?? REOPTIMIZE);
        const result = await strategy.execute(this, shipmentIndexes, options);
        this.updateIssues();
        return result;
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[], options: AddAssignOptions = {}): Promise<boolean> {
        const shipmentsRaw = shipments.map(s => s.getRaw());
        this.validateAgent(agentIndex);
        this.ensureNewItemsValid(shipmentsRaw, "shipments");
        this.validateNewShipmentsHaveLocations(shipmentsRaw);
        
        const newShipmentIndexes = this.appendShipmentsToInput(shipmentsRaw);
        
        const strategy = ShipmentStrategyFactory.createAssignStrategy(options.strategy ?? REOPTIMIZE);
        const result = await strategy.execute(this, agentIndex, newShipmentIndexes, options);
        this.updateIssues();
        return result;
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

    private validateNewShipmentsHaveLocations(shipmentsRaw: ShipmentData[]): void {
        for (let i = 0; i < shipmentsRaw.length; i++) {
            const shipment = shipmentsRaw[i];
            this.validateShipmentStepLocation(shipment.pickup, i, "pickup");
            this.validateShipmentStepLocation(shipment.delivery, i, "delivery");
        }
    }

    private validateShipmentStepLocation(
        step: ShipmentStepData | undefined,
        shipmentPosition: number,
        stepName: "pickup" | "delivery"
    ): void {
        if (!step) {
            throw new InvalidParameter(
                `New shipment at position ${shipmentPosition} must have ${stepName} step`,
                "shipments"
            );
        }

        if (step.location === undefined && step.location_index === undefined) {
            throw new InvalidParameter(
                `New shipment at position ${shipmentPosition} has ${stepName} step without location or location_index`,
                "shipments"
            );
        }
    }

}
