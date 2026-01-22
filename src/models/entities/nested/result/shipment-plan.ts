import {RouteAction} from "./route-action";
import {AgentPlan} from "./agent-plan";
import { ShipmentData } from "../../../interfaces";

export class ShipmentPlan {

    constructor(private readonly shipmentIndex: number, private readonly shipmentInputData: ShipmentData, private readonly agentPlan: AgentPlan | undefined) {
        if (!shipmentInputData) {
            throw new Error("shipmentInputData is undefined");
        }
    }

    getAgentId(): string | undefined {
        return this.agentPlan ? this.agentPlan.getAgentId() : undefined;
    }

    getAgentIndex(): number | undefined {
        return this.agentPlan ?  this.agentPlan.getAgentIndex() : undefined;
    }

    getShipmentId(): string | undefined {
        return this.shipmentInputData.id;
    }

    getShipmentIndex(): number {
        return this.shipmentIndex;
    }

    getRouteActions(): RouteAction[] {
        return this.agentPlan ? this.agentPlan.getActions().filter((action: RouteAction) => {
            action.getShipmentIndex() === this.shipmentIndex;
        }) : [];;
    }

    getAgentPlan(): AgentPlan | undefined  {
        return this.agentPlan;
    }

    getShipmentInputData(): ShipmentData {
        return this.shipmentInputData;
    }
}