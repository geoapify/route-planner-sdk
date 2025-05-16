import {RouteActionData} from "./route-action-data";
import {AgentSolutionData} from "./agent-solution-data";
import {ShipmentData} from "../input/shipment-data";

export interface ShipmentSolutionData {
    agentId: string;
    actions: RouteActionData[];
    agent: AgentSolutionData;
    shipment: ShipmentData;
}
