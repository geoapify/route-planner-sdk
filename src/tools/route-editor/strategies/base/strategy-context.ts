import { RoutePlannerResult } from "../../../../models/entities/route-planner-result";
import { RoutePlanner } from "../../../../route-planner";
import { Utils } from "../../../utils";
import { RouteMatrixHelper } from "../../route-matrix-helper";
import {ActionResponseData, FeatureResponseData, RoutePlannerResultResponseData} from "../../../../models";

/**
 * Context provided to strategies containing shared utilities and state
 */
export class StrategyContext {
    constructor(private readonly result: RoutePlannerResult) {}

    getResult(): RoutePlannerResult {
        return this.result;
    }

    getRawData(): RoutePlannerResultResponseData {
        return this.result.getRawData();
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

    getAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.result.getRawData();
        const agentFeature = rawData.features.find((f: FeatureResponseData) => f.properties.agent_index === agentIndex);
        
        if (!agentFeature) {
            throw new Error(`Agent with index ${agentIndex} has no solution`);
        }
        
        return agentFeature;
    }

    getOrCreateAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.result.getRawData();
        let agentFeature = rawData.features.find((f: any) => f.properties.agent_index === agentIndex);
        
        if (!agentFeature) {
            // Create a minimal feature structure for unassigned agents
            const agent = rawData.properties.params.agents[agentIndex];
            agentFeature = this.createEmptyAgentFeature(agentIndex, agent);
            rawData.features.push(agentFeature);
            
            // Remove from unassigned list if present
            if (rawData.properties.issues && rawData.properties.issues.unassigned_agents) {
                const unassignedIndex = rawData.properties.issues.unassigned_agents.indexOf(agentIndex);
                if (unassignedIndex !== -1) {
                    rawData.properties.issues.unassigned_agents.splice(unassignedIndex, 1);
                }
            }
        }
        
        return agentFeature;
    }

    private createEmptyAgentFeature(agentIndex: number, agent: any): FeatureResponseData {
        const startTime = (agent.time_windows && agent.time_windows.length > 0 && agent.time_windows[0].length > 0) 
            ? agent.time_windows[0][0] 
            : 0;
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: []
            },
            properties: {
                agent_index: agentIndex,
                agent_id: agent.id || `agent-${agentIndex}`,
                mode: agent.mode || 'drive',
                waypoints: [],
                time: 0,
                start_time: startTime,
                end_time: startTime,
                distance: 0,
                actions: [
                    {
                        type: 'start',
                        index: 0,
                        start_time: startTime,
                        duration: 0,
                        location_index: agent.start_location_index,
                        waypoint_index: 0
                    },
                    {
                        type: 'end',
                        index: 1,
                        start_time: startTime,
                        duration: 0,
                        location_index: agent.end_location_index !== undefined ? agent.end_location_index : agent.start_location_index,
                        waypoint_index: 1
                    }
                ]
            }
        };
    }

    findEndActionIndex(actions: ActionResponseData[]): number {
        return actions.findIndex((a: any) => a.type === 'end');
    }

    reindexActions(actions: ActionResponseData[]): void {
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

