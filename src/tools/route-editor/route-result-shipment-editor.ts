import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, RouteActionInfo, Shipment, ShipmentData } from "../../models";

export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentId: string, shipmentIds: string[]): Promise<boolean> {
        this.validateAgent(agentId);
        this.validateShipments(shipmentIds, agentId);
        for (const shipmentId of shipmentIds) {
            await this.assignShipment(shipmentId, agentId);
        }
        return true;
    }

    async removeShipments(shipmentIds: string[]) {
        this.validateShipments(shipmentIds);
        for (const shipmentId of shipmentIds) {
            await this.removeShipment(shipmentId);
        }
        return true;
    }

    async addNewShipments(agentId: string, shipments: Shipment[]) {
        let shipmentsRaw = shipments.map(shipment => shipment.getRaw());
        this.validateAgent(agentId);
        this.validateNewShipments(shipmentsRaw);
        await this.addNewShipmentsToAgent(agentId, shipmentsRaw);
        return true;
    }

    private async assignShipment(shipmentId: string, agentId: string) {
        let shipmentInfo = this.result.getShipmentInfo(shipmentId);
        let newAgentSolution = this.result.getAgentSolution(agentId)!;
        if (newAgentSolution && shipmentInfo) {
            await this.addShipmentToExistingAgent(agentId, shipmentId);
            await this.removeShipmentFromExistingAgent(shipmentInfo);
        }
        if (newAgentSolution && !shipmentInfo) {
            await this.addShipmentToExistingAgent(agentId, shipmentId);
        }
        if(!newAgentSolution && shipmentInfo) {
            await this.removeShipmentFromExistingAgent(shipmentInfo);
            await this.addShipmentToNonExistingAgent(agentId, shipmentId);
        }
        if(!newAgentSolution && !shipmentInfo) {
            await this.addShipmentToNonExistingAgent(agentId, shipmentId);
        }
    }

    private async removeShipment(shipmentId: string) {
        let shipmentInfo = this.result.getShipmentInfo(shipmentId);
        if (shipmentInfo) {
            await this.removeShipmentFromExistingAgent(shipmentInfo);
        } else {
            let shipmentInitialInfo = this.getInitialShipmentIndex(shipmentId);
            this.result.getRawData().properties.issues.unassigned_shipments =
                this.result.getRawData().properties.issues.unassigned_shipments.filter((shipmentIndex) => shipmentIndex !== shipmentInitialInfo);
        }
    }

    private async addNewShipmentsToAgent(agentId: string, shipments: ShipmentData[]) {
        let existingAgentSolution = this.result.getAgentSolution(agentId);
        this.result.getRawData().properties.params.shipments.push(...shipments);
        let newAgentInput = this.addShipmentsToAgent(agentId, shipments.map((shipment) => shipment.id!), existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addShipmentToNonExistingAgent(agentId: string, shipmentId: string) {
        let newAgentInput = this.addShipmentsToAgent(agentId, [shipmentId]);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addShipmentToExistingAgent(agentId: string, shipmentId: string) {
        let existingAgentSolution = this.result.getAgentSolution(agentId)!;
        let newAgentInput = this.addShipmentsToAgent(agentId, [shipmentId], existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async removeShipmentFromExistingAgent(shipmentInfo: RouteActionInfo) {
        let existingAgentSolution = shipmentInfo.getAgent();
        let newAgentInput = this.removeShipmentFromAgent(existingAgentSolution, shipmentInfo.getActions()[0].getShipmentId()!);
        this.addUnassignedShipment(shipmentInfo);
        if (newAgentInput.agentShipmentIds.size == 0 && newAgentInput.agentJobIds.size == 0) {
            this.removeAgent(existingAgentSolution.getAgentId());
        } else {
            let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
            this.updateAgent(optimizedRouterPlan);
        }
    }

    private addShipmentsToAgent(agentId: string, shipmentIds: string[], existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentId, existingAgent);
        shipmentIds.forEach(shipmentId => {
            optimizedAgentInput.agentShipmentIds.add(shipmentId);
        });
        return optimizedAgentInput;
    }

    private removeShipmentFromAgent(existingAgent: AgentSolution, shipmentId: string): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentId(), existingAgent);
        optimizedAgentInput.agentShipmentIds.delete(shipmentId);
        return optimizedAgentInput;
    }

    private validateShipments(shipmentIds: string[], agentId?: string) {
        if (shipmentIds.length == 0) {
            throw new Error("No shipments provided");
        }
        if (!this.checkIfArrayIsUnique(shipmentIds)) {
            throw new Error("Shipments are not unique");
        }
        shipmentIds.forEach((shipmentId) => {
            let shipmentInfo = this.result.getShipmentInfo(shipmentId);
            if (shipmentInfo == undefined) {
                this.validateShipmentExists(shipmentId);
            }
            if(agentId) {
                if (shipmentInfo?.getAgentId() == agentId) {
                    throw new Error(`Shipment with id ${shipmentId} already assigned to agent ${agentId}`);
                }
            }
        });
    }

    private validateShipmentExists(shipmentId: string) {
        let shipmentIndex = this.getInitialShipmentIndex(shipmentId);
        if (shipmentIndex == -1) {
            throw new Error(`Shipment with id ${shipmentId} not found`);
        } else {
            let isUnassignedShipment = this.result.getRawData().properties.issues.unassigned_shipments.includes(shipmentIndex);
            if (!isUnassignedShipment) {
                throw new Error(`Shipment with id ${shipmentId} not found`);
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
        shipments.forEach((job) => {
            if(job.id == undefined) {
                throw new Error("Shipment id is undefined");
            }
        });
    }

    private addUnassignedShipment(shipmentInfo: RouteActionInfo) {
        let shipmentIndex = this.getInitialShipmentIndex(shipmentInfo.getActions()[0].getShipmentId()!);
        this.generateEmptyUnassignedShipmentsIfNeeded();
        this.result.getRawData().properties.issues.unassigned_shipments.push(shipmentIndex);
    }
}