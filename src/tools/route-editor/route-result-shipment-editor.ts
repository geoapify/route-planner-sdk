import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, RouteActionInfo, Shipment, ShipmentData } from "../../models";

export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentIndex: number, shipmentIndexes: number[]): Promise<boolean> {
        this.validateAgent(agentIndex);
        this.validateShipments(shipmentIndexes, agentIndex);
        for (const shipmentIndex of shipmentIndexes) {
            await this.assignShipment(shipmentIndex, agentIndex);
        }
        return true;
    }

    async removeShipments(shipmentIndexes: number[]) {
        this.validateShipments(shipmentIndexes);
        for (const shipmentIndex of shipmentIndexes) {
            await this.removeShipment(shipmentIndex);
        }
        return true;
    }

    async addNewShipments(agentIndex: number, shipments: Shipment[]) {
        let shipmentsRaw = shipments.map(shipment => shipment.getRaw());
        this.validateAgent(agentIndex);
        this.validateNewShipments(shipmentsRaw);
        await this.addNewShipmentsToAgent(agentIndex, shipmentsRaw);
        return true;
    }

    private async assignShipment(shipmentIndex: number, agentIndex: number) {
        let shipmentInfo = this.result.getShipmentInfoByIndex(shipmentIndex);
        let newAgentSolution = this.result.getAgentSolutionByIndex(agentIndex)!;
        if (newAgentSolution && shipmentInfo) {
            await this.addShipmentToExistingAgent(agentIndex, shipmentIndex);
            await this.removeShipmentFromExistingAgent(shipmentInfo, agentIndex);
        }
        if (newAgentSolution && !shipmentInfo) {
            await this.addShipmentToExistingAgent(agentIndex, shipmentIndex);
        }
        if(!newAgentSolution && shipmentInfo) {
            await this.removeShipmentFromExistingAgent(shipmentInfo, agentIndex);
            await this.addShipmentToNonExistingAgent(agentIndex, shipmentIndex);
        }
        if(!newAgentSolution && !shipmentInfo) {
            await this.addShipmentToNonExistingAgent(agentIndex, shipmentIndex);
        }
    }

    private async removeShipment(shipmentIndex: number) {
        let shipmentInfo = this.result.getShipmentInfoByIndex(shipmentIndex);
        if (shipmentInfo) {
            await this.removeShipmentFromExistingAgent(shipmentInfo, shipmentIndex);
        } else {
            this.result.getRawData().properties.issues.unassigned_shipments =
                this.result.getRawData().properties.issues.unassigned_shipments.filter((shipmentIndex) => shipmentIndex !== shipmentIndex);
        }
    }

    private async addNewShipmentsToAgent(agentIndex: number, shipments: ShipmentData[]) {
        let existingAgentSolution = this.result.getAgentSolutionByIndex(agentIndex);
        let initialShipmentsCount = this.result.getRawData().properties.params.shipments.length;
        this.result.getRawData().properties.params.shipments.push(...shipments);
        let newAgentInput = this.addShipmentsToAgent(agentIndex, shipments.map((shipment, index) => initialShipmentsCount + index), existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async addShipmentToNonExistingAgent(agentIndex: number, shipmentIndex: number) {
        let newAgentInput = this.addShipmentsToAgent(agentIndex, [shipmentIndex]);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async addShipmentToExistingAgent(agentIndex: number, shipmentIndex: number) {
        let existingAgentSolution = this.result.getAgentSolutionByIndex(agentIndex)!;
        let newAgentInput = this.addShipmentsToAgent(agentIndex, [shipmentIndex], existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan, agentIndex);
    }

    private async removeShipmentFromExistingAgent(shipmentInfo: RouteActionInfo, originalAgentIndex: number) {
        let existingAgentSolution = shipmentInfo.getAgent();
        let newAgentInput = this.removeShipmentFromAgent(existingAgentSolution, shipmentInfo.getActions()[0].getShipmentIndex()!);
        this.addUnassignedShipment(shipmentInfo);
        if (newAgentInput.agentShipmentIndexes.size == 0 && newAgentInput.agentJobIndexes.size == 0) {
            this.removeAgent(existingAgentSolution.getAgentIndex());
        } else {
            let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
            this.updateAgent(optimizedRouterPlan, originalAgentIndex);
        }
    }

    private addShipmentsToAgent(agentIndex: number, shipmentIndexes: number[], existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentIndex, existingAgent);
        shipmentIndexes.forEach(shipmentIndex => {
            optimizedAgentInput.agentShipmentIndexes.add(shipmentIndex);
        });
        return optimizedAgentInput;
    }

    private removeShipmentFromAgent(existingAgent: AgentSolution, shipmentIndex: number): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentIndex(), existingAgent);
        optimizedAgentInput.agentShipmentIndexes.delete(shipmentIndex);
        return optimizedAgentInput;
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
            if(agentIndex) {
                if (shipmentInfo?.getAgent().getAgentIndex() == agentIndex) {
                    throw new Error(`Shipment with id ${shipmentIndex} already assigned to agent with index ${agentIndex}`);
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
                throw new Error(`Shipment with id ${shipmentIndex} not found`);
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