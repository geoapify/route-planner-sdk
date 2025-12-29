import {RoutePlannerResult} from "../../models/entities/route-planner-result";
import {RoutePlanner} from "../../route-planner";
import {Utils} from "../utils";
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

    protected async executePlan(inputData: any): Promise<boolean> {
        const planner = new RoutePlanner(this.result.getOptions(), inputData);
        const newResult = await planner.plan();
        this.updateResult(newResult);
        return true;
    }

    protected cloneInputData(): any {
        return Utils.cloneObject(this.result.getRawData().properties.params);
    }

    protected addRequirement(requirements: string[], req: string) {
        if (!requirements.includes(req)) {
            requirements.push(req);
        }
    }

    protected removeRequirement(requirements: string[], req: string) {
        const index = requirements.indexOf(req);
        if (index !== -1) {
            requirements.splice(index, 1);
        }
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
        const agentFound = this.getAgentByIndex(agentIndex);
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
            if (!agent.capabilities.includes(capabilityName)) {
                agent.capabilities.push(capabilityName);
            }
        }
    }
}