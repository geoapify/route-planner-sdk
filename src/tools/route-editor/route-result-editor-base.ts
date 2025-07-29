import {RoutePlannerResult} from "../../models/entities/route-planner-result";
import {
    AgentData,
    JobData,
    ShipmentData
} from "../../models";

export class RouteResultEditorBase {
    protected readonly result: RoutePlannerResult;
    protected readonly unassignedReq = "unassigned";
    protected readonly assignAgentReqStart = "assign-agent-";

    constructor(result: RoutePlannerResult) {
        this.result = result;
    }

    protected checkIfArrayIsUnique(myArray: any[]) {
        return myArray.length === new Set(myArray).size;
    }

    protected getAgentByIndex(agentIndex: number): AgentData {
        return this.result.getRawData().properties.params.agents[agentIndex];
    }

    protected getJobByIndex(jobIndex: number): JobData {
        return this.result.getRawData().properties.params.jobs[jobIndex];
    }

    protected getShipmentByIndex(shipmentIndex: number): ShipmentData {
        return this.result.getRawData().properties.params.shipments[shipmentIndex];
    }

    protected validateAgent(agentIndex: number) {
        let agentFound = this.getAgentByIndex(agentIndex);
        if (!agentFound) {
            throw new Error(`Agent with index ${agentIndex} not found`);
        }
    }

    protected updateResult(newResult: RoutePlannerResult) {
        this.result.getRawData().features = newResult.getRawData().features;
        this.result.getRawData().properties.issues = newResult.getRawData().properties.issues;
    }

    protected addAgentCapabilities(agents: any[]) {
        for (let agentIndex = 0; agentIndex < agents.length; agentIndex++) {
            const agent = agents[agentIndex];
            const capabilityName = `assign-agent-${agentIndex}`;
            if (!agent.capabilities) {
                agent.capabilities = [];
            }
            // Only add the capability if it's not already present
            if (!agent.capabilities.includes(capabilityName)) {
                agent.capabilities.push(capabilityName);
            }
        }
    }
}