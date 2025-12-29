import { RouteResultEditorBase } from "./route-result-editor-base";
import { Shipment, ShipmentData, AddAssignOptions, RemoveOptions } from "../../models";

export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentIndex: number, shipmentIndexes: number[], options: AddAssignOptions = {}): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateShipments(shipmentIndexes, agentIndex);
        this.applyPriority(shipmentIndexes, options.priority);
        
        return this.replanWithShipmentsAssignedToAgent(agentIndex, shipmentIndexes);
    }

    async removeShipments(shipmentIndexes: number[], options: RemoveOptions = {}): Promise<boolean> {
        this.validateShipments(shipmentIndexes);
        return this.replanWithShipmentsUnassigned(shipmentIndexes);
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[], options: AddAssignOptions = {}): Promise<boolean> {
        const shipmentsRaw = shipments.map(s => s.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewShipments(shipmentsRaw);
        
        const newShipmentIndexes = this.appendShipmentsToInput(shipmentsRaw);
        return this.replanWithShipmentsAssignedToAgent(agentIndex, newShipmentIndexes);
    }

    private async replanWithShipmentsAssignedToAgent(agentIndex: number, shipmentIndexes: number[]): Promise<boolean> {
        const inputData = this.cloneInputData();
        
        this.markExistingUnassignedShipments(inputData.shipments);
        this.markShipmentsForAgent(inputData.shipments, shipmentIndexes, agentIndex);
        this.markRemainingShipmentsWithAgentRequirement(inputData.shipments, shipmentIndexes);
        this.addAgentCapabilities(inputData.agents);

        return this.executePlan(inputData);
    }

    private async replanWithShipmentsUnassigned(shipmentIndexes: number[]): Promise<boolean> {
        const inputData = this.cloneInputData();
        
        this.markShipmentsUnassigned(inputData.shipments, shipmentIndexes);
        this.markExistingUnassignedShipments(inputData.shipments);
        this.markRemainingShipmentsWithAgentRequirement(inputData.shipments, shipmentIndexes);
        this.addAgentCapabilities(inputData.agents);

        return this.executePlan(inputData);
    }

    private appendShipmentsToInput(shipmentsRaw: ShipmentData[]): number[] {
        const startIndex = this.result.getRawData().properties.params.shipments.length;
        this.result.getRawData().properties.params.shipments.push(...shipmentsRaw);
        return shipmentsRaw.map((_, i) => startIndex + i);
    }

    private applyPriority(shipmentIndexes: number[], priority?: number) {
        if (priority === undefined) return;
        for (const shipmentIndex of shipmentIndexes) {
            this.result.getRawData().properties.params.shipments[shipmentIndex].priority = priority;
        }
    }

    private markExistingUnassignedShipments(shipments: ShipmentData[]) {
        const unassignedShipments = this.result.getRawData().properties.issues?.unassigned_shipments;
        if (unassignedShipments) {
            this.markShipmentsUnassigned(shipments, unassignedShipments);
        }
    }

    private markShipmentsUnassigned(shipments: ShipmentData[], shipmentIndexes: number[]) {
        for (const shipmentIndex of shipmentIndexes) {
            if (!shipments[shipmentIndex]) continue;
            if (!shipments[shipmentIndex].requirements) {
                shipments[shipmentIndex].requirements = [];
            }
            if (!shipments[shipmentIndex].requirements.includes(this.unassignedReq)) {
                shipments[shipmentIndex].requirements.push(this.unassignedReq);
            }
        }
    }

    private markRemainingShipmentsWithAgentRequirement(shipments: ShipmentData[], excludeIndexes: number[]) {
        for (let i = 0; i < shipments.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const shipmentInfo = this.result.getShipmentInfoByIndex(i);
            if (!shipmentInfo) continue;
            
            const agentIndex = shipmentInfo.getAgent().getAgentIndex();
            const assignAgentReq = `${this.assignAgentReqStart}${agentIndex}`;
            
            if (!shipments[i].requirements) {
                shipments[i].requirements = [];
            }
            this.removeRequirement(shipments[i].requirements, this.unassignedReq);
            this.addRequirement(shipments[i].requirements, assignAgentReq);
        }
    }

    private markShipmentsForAgent(shipments: ShipmentData[], shipmentIndexes: number[], agentIndex: number) {
        const assignAgentReq = `assign-agent-${agentIndex}`;
        for (const shipmentIndex of shipmentIndexes) {
            if (!shipments[shipmentIndex]) continue;
            if (!shipments[shipmentIndex].requirements) {
                shipments[shipmentIndex].requirements = [];
            }
            this.removeRequirement(shipments[shipmentIndex].requirements, this.unassignedReq);
            this.addRequirement(shipments[shipmentIndex].requirements, assignAgentReq);
        }
    }

    private validateShipments(shipmentIndexes: number[], agentIndex?: number) {
        if (shipmentIndexes.length === 0) {
            throw new Error("No shipments provided");
        }
        if (!this.checkIfArrayIsUnique(shipmentIndexes)) {
            throw new Error("Shipments are not unique");
        }
        for (const shipmentIndex of shipmentIndexes) {
            const shipmentInfo = this.result.getShipmentInfoByIndex(shipmentIndex);
            if (!shipmentInfo) {
                this.validateShipmentExists(shipmentIndex);
            }
            if (agentIndex !== undefined && shipmentInfo?.getAgent().getAgentIndex() === agentIndex) {
                throw new Error(`Shipment with index ${shipmentIndex} already assigned to agent with index ${agentIndex}`);
            }
        }
    }

    private validateShipmentExists(shipmentIndex: number) {
        const shipmentFound = this.getShipmentByIndex(shipmentIndex);
        if (!shipmentFound) {
            throw new Error(`Shipment with index ${shipmentIndex} not found`);
        }
        const isUnassignedShipment = this.result.getRawData().properties.issues?.unassigned_shipments?.includes(shipmentIndex);
        if (!isUnassignedShipment) {
            throw new Error(`Shipment with index ${shipmentIndex} is invalid`);
        }
    }

    private validateNewShipments(shipments: ShipmentData[]) {
        if (shipments.length === 0) {
            throw new Error("No shipments provided");
        }
        if (!this.checkIfArrayIsUnique(shipments)) {
            throw new Error("Shipments are not unique");
        }
    }
}
