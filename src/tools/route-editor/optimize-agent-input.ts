export class OptimizeAgentInput {
    agentJobIds: Set<string>;
    agentShipmentIds: Set<string>;
    agentId: string;

    constructor(agentId: string, agentJobIds: string[], agentShipmentIds: string[]) {
        this.agentId = agentId;
        this.agentJobIds = new Set(agentJobIds);
        this.agentShipmentIds = new Set(agentShipmentIds);
    }
}