export class OptimizeAgentInput {
    agentJobIndexes: Set<number>;
    agentShipmentIndexes: Set<number>;
    agentIndex: number;

    constructor(agentIndex: number, agentJobIndexes: number[], agentShipmentIndexes: number[]) {
        this.agentIndex = agentIndex;
        this.agentJobIndexes = new Set(agentJobIndexes);
        this.agentShipmentIndexes = new Set(agentShipmentIndexes);
    }
}