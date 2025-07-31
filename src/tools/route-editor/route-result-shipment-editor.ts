import { RouteResultEditorBase } from "./route-result-editor-base";
import { Shipment, ShipmentData } from "../../models";
import { RoutePlanner } from "../../route-planner";
import { Utils } from "../utils";

export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentIndex: number, shipmentIndexes: number[], newPriority?: number): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateShipments(shipmentIndexes, agentIndex);
        
        for (const shipmentIndex of shipmentIndexes) {
            this.setShipmentPriority(shipmentIndex, newPriority);
        }
        
        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);

        if(this.result.getRawData().properties.issues?.unassigned_shipments) {
            this.markShipmentsUnassigned(inputDataCopy.shipments, this.result.getRawData().properties.issues.unassigned_shipments);
        }
        this.markShipmentsForAgent(inputDataCopy.shipments, shipmentIndexes, agentIndex);
        this.markRemainingShipmentsWithAgentRequirement(inputDataCopy.shipments, shipmentIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);

        return true;
    }

    async removeShipments(shipmentIndexes: number[]) {
        this.validateShipments(shipmentIndexes);

        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);
        
        this.markShipmentsUnassigned(inputDataCopy.shipments, shipmentIndexes);
        if(this.result.getRawData().properties.issues?.unassigned_shipments) {
            this.markShipmentsUnassigned(inputDataCopy.shipments, this.result.getRawData().properties.issues.unassigned_shipments);
        }
        this.markRemainingShipmentsWithAgentRequirement(inputDataCopy.shipments, shipmentIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);

        return true;
    }

    private markShipmentsUnassigned(shipments: ShipmentData[], shipmentIndexes: number[]) {
        shipmentIndexes.forEach(shipmentIndex => {
            if (shipments[shipmentIndex]) {
                if (!shipments[shipmentIndex].requirements) {
                    shipments[shipmentIndex].requirements = [];
                }
                if (!shipments[shipmentIndex].requirements.includes(this.unassignedReq)) {
                    shipments[shipmentIndex].requirements.push(this.unassignedReq);
                }
            }
        });
    }

    private markRemainingShipmentsWithAgentRequirement(shipments: ShipmentData[], shipmentIndexes: number[]) {
        for (let i = 0; i < shipments.length; i++) {
            if (!shipmentIndexes.includes(i)) {
                // This is a remaining shipment, find which agent it belongs to
                const shipmentInfo = this.result.getShipmentInfoByIndex(i);
                if (shipmentInfo) {
                    const agentIndex = shipmentInfo.getAgent().getAgentIndex();
                    const assignAgentReq = `${this.assignAgentReqStart}${agentIndex}`;
                    if (!shipments[i].requirements) {
                        shipments[i].requirements = [];
                    }
                    if (!shipments[i].requirements.includes(assignAgentReq)) {
                        shipments[i].requirements.push(assignAgentReq);
                    }
                }
            }
        }
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[]) {
        let shipmentsRaw = shipments.map(shipment => shipment.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewShipments(shipmentsRaw);
        
        // Add new shipments to the original data (permanent change)
        const initialShipmentsCount = this.result.getRawData().properties.params.shipments.length;
        this.result.getRawData().properties.params.shipments.push(...shipmentsRaw);
        
        // Get the indexes of the newly added shipments
        const newShipmentIndexes = shipmentsRaw.map((_, index) => initialShipmentsCount + index);
        
        // Clone the input data for planning
        const inputDataCopy = Utils.cloneObject(this.result.getRawData().properties.params);
        
        // Apply temporary requirements and capabilities for planning
        if(this.result.getRawData().properties.issues?.unassigned_shipments) {
            this.markShipmentsUnassigned(inputDataCopy.shipments, this.result.getRawData().properties.issues.unassigned_shipments);
        }
        this.markShipmentsForAgent(inputDataCopy.shipments, newShipmentIndexes, agentIndex);
        this.markRemainingShipmentsWithAgentRequirement(inputDataCopy.shipments, newShipmentIndexes);
        this.addAgentCapabilities(inputDataCopy.agents);

        const planner = new RoutePlanner(this.result.getOptions(), inputDataCopy);
        const newResult = await planner.plan();
        
        this.updateResult(newResult);
        
        return true;
    }

    private validateShipments(shipmentIndexes: number[], agentIndex?: number) {
        if (shipmentIndexes.length == 0) {
            throw new Error("No shipments provided");
        }
        if (!this.checkIfArrayIsUnique(shipmentIndexes)) {
            throw new Error("Shipments are not unique");
        }
        shipmentIndexes.forEach((shipmentIndex) => {
            let shipmentInfo = this.result.getShipmentInfoByIndex(shipmentIndex);
            if (shipmentInfo == undefined) {
                this.validateShipmentExists(shipmentIndex);
            }
            if(agentIndex != undefined) {
                if (shipmentInfo?.getAgent().getAgentIndex() == agentIndex) {
                    throw new Error(`Shipment with index ${shipmentIndex} already assigned to agent with index ${agentIndex}`);
                }
            }
        });
    }

    private validateShipmentExists(shipmentIndex: number) {
        let shipmentFound = this.getShipmentByIndex(shipmentIndex);
        if (!shipmentFound) {
            throw new Error(`Shipment with index ${shipmentIndex} not found`);
        } else {
            let isUnassignedShipment = this.result.getRawData().properties.issues.unassigned_shipments.includes(shipmentIndex);
            if (!isUnassignedShipment) {
                throw new Error(`Shipment with index ${shipmentIndex} is invalid`);
            }
        }
    }

    private validateNewShipments(shipments: ShipmentData[]) {
        if (shipments.length == 0) {
            throw new Error("No shipments provided");
        }
        if (!this.checkIfArrayIsUnique(shipments)) {
            throw new Error("Shipments are not unique");
        }
    }

    private setShipmentPriority(jobIndex: number, newPriority?: number) {
        if (newPriority != undefined) {
            this.result.getRawData().properties.params.shipments[jobIndex].priority = newPriority;
        }
    }

    private markShipmentsForAgent(shipments: ShipmentData[], shipmentIndexes: number[], agentIndex: number) {
        shipmentIndexes.forEach(shipmentIndex => {
            if (shipments[shipmentIndex]) {
                const assignAgentReq = `assign-agent-${agentIndex}`;
                if (!shipments[shipmentIndex].requirements) {
                    shipments[shipmentIndex].requirements = [];
                }
                if(shipments[shipmentIndex].requirements.includes('unassigned')) {
                    shipments[shipmentIndex].requirements.splice(shipments[shipmentIndex].requirements.indexOf('unassigned'), 1);
                }
                if (!shipments[shipmentIndex].requirements.includes(assignAgentReq)) {
                    shipments[shipmentIndex].requirements.push(assignAgentReq);
                }
            }
        });
    }
}