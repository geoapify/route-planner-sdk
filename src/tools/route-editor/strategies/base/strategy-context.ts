import { RoutePlannerResult } from "../../../../models/entities/route-planner-result";
import { RoutePlanner } from "../../../../route-planner";
import { Utils } from "../../../utils";
import { RouteMatrixHelper } from "../../route-matrix-helper";

/**
 * Context provided to strategies containing shared utilities and state
 */
export class StrategyContext {
    constructor(private readonly result: RoutePlannerResult) {}

    getResult(): RoutePlannerResult {
        return this.result;
    }

    getRawData(): any {
        return this.result.getRawData();
    }

    getOptions(): any {
        return this.result.getOptions();
    }

    cloneInputData(): any {
        return Utils.cloneObject(this.result.getRawData().properties.params);
    }

    async executePlan(inputData: any): Promise<boolean> {
        const planner = new RoutePlanner(this.result.getOptions(), inputData);
        const newResult = await planner.plan();
        this.updateResult(newResult);
        return true;
    }

    private updateResult(newResult: RoutePlannerResult): void {
        this.result.getRawData().features = newResult.getRawData().features;
        this.result.getRawData().properties.issues = newResult.getRawData().properties.issues;
    }

    createMatrixHelper(): RouteMatrixHelper {
        return new RouteMatrixHelper(this.result.getOptions());
    }

    getAgentFeature(agentIndex: number): any {
        const rawData = this.result.getRawData();
        const agentFeature = rawData.features.find((f: any) => f.properties.agent_index === agentIndex);
        
        if (!agentFeature) {
            throw new Error(`Agent with index ${agentIndex} has no solution`);
        }
        
        return agentFeature;
    }

    findEndActionIndex(actions: any[]): number {
        return actions.findIndex((a: any) => a.type === 'end');
    }

    reindexActions(actions: any[]): void {
        actions.forEach((action: any, idx: number) => {
            action.index = idx;
        });
    }

    addAgentCapabilities(agents: any[]): void {
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

