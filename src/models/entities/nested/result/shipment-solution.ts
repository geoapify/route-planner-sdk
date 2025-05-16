import {ShipmentSolutionData} from "../../../interfaces/nested/result/shipment-solution-data";
import {RouteAction} from "./route-action";
import {AgentSolution} from "./agent-solution";
import {Shipment} from "../input/shipment";

export class ShipmentSolution {
    private readonly raw: ShipmentSolutionData;

    constructor(raw?: ShipmentSolutionData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("ShipmentSolutionData is undefined");
        }
    }

    getRaw(): ShipmentSolutionData {
        return this.raw;
    }

     getAgentId(): string {
        return this.raw.agentId;
    }

    getActions(): RouteAction[] {
        return this.raw.actions.map((action) => new RouteAction(action));
    }

    getAgent(): AgentSolution {
        return new AgentSolution(this.raw.agent);
    }

    getShipment(): Shipment {
        return new Shipment(this.raw.shipment);
    }
}