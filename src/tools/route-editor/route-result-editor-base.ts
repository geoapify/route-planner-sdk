import {
    ActionResponseData,
    FeatureResponseData, RoutePlannerResult,
    RoutePlannerResultResponseDataExtended,
    RoutingOptions,
    WaypointData,
    AgentHasNoPlan, AgentNotFound, NoItemsProvided, ItemsNotUnique
} from "../../models";
import { RoutePlannerCallOptions } from "../../models/interfaces/route-planner-call-options";
import {RouteMatrixHelper} from "./strategies/preserve-order/utils/route-matrix-helper";
import {RoutingHelper} from "./strategies/preserve-order/utils/routing-helper";
import {RoutePlanner} from "../../route-planner";
import {Utils} from "../utils";

/**
 * Base class for route result editors with shared functionality
 */
export abstract class RouteResultEditorBase {

    constructor(protected readonly rawData: RoutePlannerResultResponseDataExtended, protected readonly callOptions: RoutePlannerCallOptions, protected readonly routingOptions: RoutingOptions) {
        this.rawData = rawData;
    }

    validateAgent(agentIndex: number): void {
        const agentFound = this.rawData.properties.params.agents[agentIndex];
        if (!agentFound) {
            throw new AgentNotFound(`Agent with index ${agentIndex} not found`, agentIndex);
        }
    }

    protected ensureItemsProvided(indexes: number[], itemType: string): void {
        if (indexes.length === 0) {
            throw new NoItemsProvided(`No ${itemType} provided`, itemType);
        }
    }

    protected ensureItemsUnique(indexes: number[], itemType: string): void {
        if (indexes.length !== new Set(indexes).size) {
            const capitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            throw new ItemsNotUnique(`${capitalized} are not unique`, itemType);
        }
    }

    protected ensureNewItemsValid<T>(items: T[], itemType: string): void {
        if (items.length === 0) {
            throw new NoItemsProvided(`No ${itemType} provided`, itemType);
        }
        if (items.length !== new Set(items).size) {
            const capitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            throw new ItemsNotUnique(`${capitalized} are not unique`, itemType);
        }
    }

    getRawData(): RoutePlannerResultResponseDataExtended {
        return this.rawData;
    }

    cloneInputData(): any {
        return Utils.cloneObject(this.rawData.properties.params);
    }

    async executePlan(inputData: any): Promise<boolean> {
        const planner = new RoutePlanner(this.callOptions, inputData);
        const newResult = await planner.plan();
        this.updateResult(newResult);
        return true;
    }

    private updateResult(newResult: RoutePlannerResult): void {
        this.rawData.features = newResult.getRaw().features;
        this.rawData.properties.issues = newResult.getRaw().properties.issues;
    }

    getMatrixHelper(): RouteMatrixHelper {
        return new RouteMatrixHelper(this.callOptions, this.routingOptions);
    }

    getRoutingHelper(): RoutingHelper {
        return new RoutingHelper(this.callOptions, this.routingOptions);
    }

    getAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.rawData;
        const agentFeature = rawData.features.find((f: FeatureResponseData) => f.properties.agent_index === agentIndex);

        if (!agentFeature) {
            throw new AgentHasNoPlan(`Agent with index ${agentIndex} has no Plan`, agentIndex);
        }

        return agentFeature;
    }

    getOrCreateAgentFeature(agentIndex: number): FeatureResponseData {
        const rawData = this.rawData;
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

    getExistingConsecutiveTravelTimes(agentIndex: number): number[] {
        const agentFeature = this.getRawData().features.find(
            feature => feature.properties.agent_index === agentIndex
        );

        if (!agentFeature?.properties?.legs) {
            return [];
        }

        return agentFeature.properties.legs.map(leg => leg.time);
    }
}
