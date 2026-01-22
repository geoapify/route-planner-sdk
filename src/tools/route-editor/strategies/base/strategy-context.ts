import { RoutePlannerResult } from "../../../../models/entities/route-planner-result";
import { RoutePlanner } from "../../../../route-planner";
import { Utils } from "../../../utils";
import { RouteMatrixHelper } from "../../route-matrix-helper";
import {
    ActionResponseData,
    FeatureResponseData,
    RoutePlannerResultResponseData,
    RoutingOptions,
    WaypointData
} from "../../../../models";
import { RoutePlannerCallOptions } from "../../../../models/interfaces/route-planner-call-options";

/**
 * Context provided to strategies containing shared utilities and state
 */

//ToDo: this is actually a Helper, not a Context
export class StrategyContext {
    constructor(private readonly resultRawData: RoutePlannerResultResponseData, private routePlannerCallOptions: RoutePlannerCallOptions, private routingOptions: RoutingOptions) {}

    getRawData(): RoutePlannerResultResponseData {
        return this.resultRawData;
    }

    cloneInputData(): any {
        return Utils.cloneObject(this.resultRawData.properties.params);
    }

    async executePlan(inputData: any): Promise<boolean> {
        const planner = new RoutePlanner(this.routePlannerCallOptions, inputData);
        const newResult = await planner.plan();
        this.updateResult(newResult);
        return true;
    }

    private updateResult(newResult: RoutePlannerResult): void {
        this.resultRawData.features = newResult.getRaw().features;
        this.resultRawData.properties.issues = newResult.getRaw().properties.issues;
    }

    createMatrixHelper(): RouteMatrixHelper {
        // ToDo: Should be getMatrixHelper
        return new RouteMatrixHelper(this.routePlannerCallOptions, this.routingOptions);
    }

    getAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.resultRawData;
        const agentFeature = rawData.features.find((f: FeatureResponseData) => f.properties.agent_index === agentIndex);
        
        if (!agentFeature) {

            // ToDo: We need t

            throw new Error(`Agent with index ${agentIndex} has no Plan`);
        }
        
        return agentFeature;
    }

    getOrCreateAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.resultRawData;
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

    getAgentIndexForShipment(shipmentIndex: number): number | undefined {
        const features = this.getRawData().features;

        for (const feature of features) {
            for (const action of feature.properties.actions) {
                if (action.shipment_index === shipmentIndex) {
                    return feature.properties.agent_index;
                }
            }
        }

        return undefined;
    }

    getAgentShipments(agentIndex: number): number[] {
        const agentFeature = this.getRawData().features.find(
            feature => feature.properties.agent_index === agentIndex
        );

        if (!agentFeature) {
            return [];
        }

        const shipmentIndexes: number[] = [];

        for (const action of agentFeature.properties.actions) {
            if (action.shipment_index !== undefined && !shipmentIndexes.includes(action.shipment_index)) {
                shipmentIndexes.push(action.shipment_index);
            }
        }

        return shipmentIndexes;
    }

    getAgentIndexForJob(jobIndex: number): number | undefined {
        for (const agentFeature of this.getRawData().features) {
            for (const action of agentFeature.properties.actions) {
                if (action.job_index === jobIndex) {
                    return agentFeature.properties.agent_index;
                }
            }
        }

        return undefined;
    }

    getAgentJobs(agentIndex: number): number[] {
        const agentFeature = this.getRawData().features.find(
            feature => feature.properties.agent_index === agentIndex
        );

        if (!agentFeature) {
            return [];
        }

        const jobIndexes: number[] = [];

        for (const action of agentFeature.properties.actions) {
            if (action.job_index !== undefined && !jobIndexes.includes(action.job_index)) {
                jobIndexes.push(action.job_index);
            }
        }

        return jobIndexes;
    }

    getAgentActions(agentIndex: number): ActionResponseData[] {
        const agentFeature = this.getRawData().features.find(
            feature => feature.properties.agent_index === agentIndex
        );

        return agentFeature ? agentFeature.properties.actions : [];
    }

    getAgentWaypoints(agentIndex: number): WaypointData[] {
        const agentFeature = this.getRawData().features.find(
            feature => feature.properties.agent_index === agentIndex
        );

        return agentFeature ? agentFeature.properties.waypoints : [];
    }
}

