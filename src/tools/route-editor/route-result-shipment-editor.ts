import { RouteResultEditorBase } from "./route-result-editor-base";
import { OptimizeAgentInput } from "./optimize-agent-input";
import { AgentSolution, RouteActionInfo } from "../../models";

export class RouteResultShipmentEditor extends RouteResultEditorBase {

    async assignShipments(agentId: string, shipmentIds: string[]): Promise<boolean> {
        this.validateAgent(agentId);
        this.validateShipments(agentId, shipmentIds);
        for (const shipmentId of shipmentIds) {
            await this.assignShipment(shipmentId, agentId);
        }
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
            await this.addShipmentToNonExistingAgent(agentId, shipmentId);
            await this.removeShipmentFromExistingAgent(shipmentInfo);
        }
        if(!newAgentSolution && !shipmentInfo) {
            await this.addShipmentToNonExistingAgent(agentId, shipmentId);
        }
    }

    private async addShipmentToNonExistingAgent(agentId: string, shipmentId: string) {
        let newAgentInput = this.addShipmentToAgent(agentId, shipmentId);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async addShipmentToExistingAgent(agentId: string, shipmentId: string) {
        let existingAgentSolution = this.result.getAgentSolution(agentId)!;
        let newAgentInput = this.addShipmentToAgent(agentId, shipmentId, existingAgentSolution);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private async removeShipmentFromExistingAgent(shipmentInfo: RouteActionInfo) {
        let existingAgentSolution = shipmentInfo.getAgent();
        let newAgentInput = this.removeShipmentFromAgent(existingAgentSolution, shipmentInfo.getAction().getShipmentId()!);
        let optimizedRouterPlan = await this.optimizeRoute(newAgentInput);
        this.updateAgent(optimizedRouterPlan);
    }

    private addShipmentToAgent(agentId: string, shipmentId: string, existingAgent?: AgentSolution): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(agentId, existingAgent);
        optimizedAgentInput.agentShipmentIds.add(shipmentId);
        return optimizedAgentInput;
    }

    private removeShipmentFromAgent(existingAgent: AgentSolution, shipmentId: string): OptimizeAgentInput {
        let optimizedAgentInput = this.generateOptimizeAgentInput(existingAgent.getAgentId(), existingAgent);
        optimizedAgentInput.agentShipmentIds.delete(shipmentId);
        return optimizedAgentInput;
    }

    private validateShipments(agentId: string, shipmentIds: string[]) {
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
            if (shipmentInfo?.getAgentId() == agentId) {
                throw new Error(`Shipment with id ${shipmentId} already assigned to agent ${agentId}`);
            }
        });
    }

    private validateShipmentExists(shipmentId: string) {
        let shipmentIndex = this.getInitialShipmentIndex(shipmentId);
        if (shipmentIndex == -1) {
            throw new Error(`Shipment with id ${shipmentId} not found`);
        } else {
            let isUnassignedShipment = this.result.getUnassignedShipments().includes(shipmentIndex);
            if (!isUnassignedShipment) {
                throw new Error(`Shipment with id ${shipmentId} not found`);
            }
        }
    }
}