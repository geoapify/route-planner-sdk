export class OptimizeAgentInput {
    agentJobIds: Set<string>;
    agentShipmentIds: Set<string>;
    agentLocationIds: Set<string>;
    agentId: string;

    constructor(agentId: string, agentJobIds: string[], agentShipmentIds: string[], agentLocationIds: string[]) {
        this.agentId = agentId;
        this.agentJobIds = new Set(agentJobIds);
        this.agentShipmentIds = new Set(agentShipmentIds);
        this.agentLocationIds = new Set(agentLocationIds);
    }
}