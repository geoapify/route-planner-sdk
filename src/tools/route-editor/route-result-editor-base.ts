import {
    ActionResponseData,
    AgentData,
    FeatureResponseData, RoutePlannerResult,
    RoutePlannerResultResponseDataExtended,
    RoutingOptions,
    WaypointResponseData,
    AgentHasNoPlan, AgentNotFound, NoItemsProvided, ItemsNotUnique,
    RoutePlannerInputData
} from "../../models";
import { RoutePlannerCallOptions } from "../../models/interfaces/route-planner-call-options";
import {RouteMatrixHelper} from "./strategies/preserve-order/utils/route-matrix-helper";
import {RoutingHelper} from "./strategies/preserve-order/utils/routing-helper";
import {RoutePlanner} from "../../route-planner";
import {Utils} from "../utils";
import { LegRecalculator } from "./strategies";

const MISSING_ROUTE_METRIC = -1;

type AgentLocationData = {
    location: [number, number];
    locationIndex?: number;
    locationId?: string;
};

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

    async executeAgentPlan(agentIndex: number, inputData: RoutePlannerInputData): Promise<boolean> {

        if (!inputData.shipments?.length && !inputData.jobs?.length) {
            this.updateAgentAsUnassigned(agentIndex)
        } else {
            const planner = new RoutePlanner(this.callOptions, inputData);
            const newResult = await planner.plan();

            if (newResult.getRaw().features?.length === 0) {
                this.updateAgentAsUnassigned(agentIndex);
                return true;
            }

            const newAgentData = newResult.getRaw().features?.[0];
            newAgentData.properties.agent_index = agentIndex;
            const featureIndex = this.rawData.features.findIndex(
                (feature) => feature.properties.agent_index === agentIndex
            );
            if (featureIndex === -1) {
                this.rawData.features.push(newAgentData);
            } else {
                this.rawData.features[featureIndex] = newAgentData;
            }
        }

        return true;
    }

    public updateIssues(): void {
        const issues = this.rawData.properties.issues || (this.rawData.properties.issues = {});
        const params = this.rawData.properties.params;

        const assignedAgentIndexes = new Set<number>();
        const assignedJobIndexes = new Set<number>();
        const assignedShipmentIndexes = new Set<number>();

        for (const feature of this.rawData.features || []) {
            const agentIndex = feature?.properties?.agent_index;
            if (typeof agentIndex === "number") {
                assignedAgentIndexes.add(agentIndex);
            }

            for (const action of feature?.properties?.actions || []) {
                if (typeof action.job_index === "number") {
                    assignedJobIndexes.add(action.job_index);
                }
                if (typeof action.shipment_index === "number") {
                    assignedShipmentIndexes.add(action.shipment_index);
                }
            }
        }

        issues.unassigned_agents = this.getUnassignedIndexes(params.agents.length, assignedAgentIndexes);
        issues.unassigned_jobs = this.getUnassignedIndexes((params.jobs || []).length, assignedJobIndexes);
        issues.unassigned_shipments = this.getUnassignedIndexes((params.shipments || []).length, assignedShipmentIndexes);
    }

    private updateAgentAsUnassigned(agentIndex: number): void {
        const featureIndex = this.rawData.features.findIndex(
            (feature: FeatureResponseData) => feature.properties.agent_index === agentIndex
        );

        if (featureIndex !== -1) {
            this.rawData.features.splice(featureIndex, 1);
        }
    }

    private getUnassignedIndexes(totalCount: number, assignedIndexes: Set<number>): number[] {
        const unassigned: number[] = [];

        for (let index = 0; index < totalCount; index++) {
            if (!assignedIndexes.has(index)) {
                unassigned.push(index);
            }
        }

        return unassigned;
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

    async getOrCreateAgentFeature(agentIndex: number): Promise<FeatureResponseData> {
        const rawData = this.rawData;
        let agentFeature = rawData.features.find((f: any) => f.properties.agent_index === agentIndex);
        let isNewAgentFeature = false;

        if (!agentFeature) {
            // Create a minimal feature structure for unassigned agents
            const agent = rawData.properties.params.agents[agentIndex];

            agentFeature = this.createEmptyAgentFeature(agentIndex, agent);
            isNewAgentFeature = true;
            rawData.features.push(agentFeature);

            // Remove from unassigned list if present
            if (rawData.properties.issues && rawData.properties.issues.unassigned_agents) {
                const unassignedIndex = rawData.properties.issues.unassigned_agents.indexOf(agentIndex);
                if (unassignedIndex !== -1) {
                    rawData.properties.issues.unassigned_agents.splice(unassignedIndex, 1);
                }
            }
        }

        if (isNewAgentFeature) {
            await LegRecalculator.fillMissingLegData(this, agentFeature);
        }

        return agentFeature;
    }

    private createEmptyAgentFeature(agentIndex: number, agent: AgentData & { mode?: string }): FeatureResponseData {
        const startTime = (agent.time_windows && agent.time_windows.length > 0 && agent.time_windows[0].length > 0)
            ? agent.time_windows[0][0]
            : 0;

        const startLocation = this.resolveAgentLocation(agentIndex, agent, "start");
        const endLocation = this.resolveAgentLocation(agentIndex, agent, "end");
        const hasStartLocation = !!startLocation;
        const hasEndLocation = !!endLocation;
        const hasSeparateStartEnd = hasStartLocation && hasEndLocation;

        const effectiveStart = startLocation ?? endLocation;
        const effectiveEnd = endLocation ?? startLocation;

        if (!effectiveStart || !effectiveEnd) {
            throw new Error(`Agent ${agentIndex} must have start_location(_index) or end_location(_index)`);
        }

        const startAction = {
            type: "start",
            index: 0,
            start_time: startTime,
            duration: 0,
            location_index: effectiveStart.locationIndex,
            location_id: effectiveStart.locationId,
            waypoint_index: 0
        };

        const endAction = hasEndLocation
            ? {
                type: "end",
                index: 1,
                start_time: startTime,
                duration: 0,
                location_index: effectiveEnd.locationIndex,
                location_id: effectiveEnd.locationId,
                waypoint_index: hasSeparateStartEnd ? 1 : 0
            }
            : undefined;

        const waypoints = hasSeparateStartEnd
            ? [
                {
                    original_location: effectiveStart.location,
                    original_location_index: effectiveStart.locationIndex,
                    original_location_id: effectiveStart.locationId,
                    start_time: startTime,
                    duration: 0,
                    actions: [{ ...startAction }],
                    prev_leg_index: undefined,
                    next_leg_index: 0
                },
                {
                    original_location: effectiveEnd.location,
                    original_location_index: effectiveEnd.locationIndex,
                    original_location_id: effectiveEnd.locationId,
                    start_time: startTime,
                    duration: 0,
                    actions: endAction ? [{ ...endAction }] : [],
                    prev_leg_index: 0,
                    next_leg_index: undefined
                }
            ]
            : [
                {
                    original_location: effectiveStart.location,
                    original_location_index: effectiveStart.locationIndex,
                    original_location_id: effectiveStart.locationId,
                    start_time: startTime,
                    duration: 0,
                    actions: endAction ? [{ ...startAction }, { ...endAction }] : [{ ...startAction }],
                    prev_leg_index: undefined,
                    next_leg_index: undefined
                }
            ];

        const legs = hasSeparateStartEnd
            ? [
                {
                    from_waypoint_index: 0,
                    to_waypoint_index: 1,
                    time: MISSING_ROUTE_METRIC,
                    distance: MISSING_ROUTE_METRIC,
                    steps: []
                }
            ]
            : [];
        const geometryCoordinates = hasSeparateStartEnd
            ? [[effectiveStart.location, effectiveEnd.location]] // this should be overwritten later by locations from Routing API
            : [];

        return {
            type: 'Feature',
            geometry: {
                type: 'MultiLineString',
                coordinates: geometryCoordinates
            },
            properties: {
                agent_index: agentIndex,
                agent_id: agent.id || `agent-${agentIndex}`,
                mode: agent.mode || this.rawData.properties.params.mode || 'drive',
                waypoints,
                legs,
                time: 0,
                start_time: startTime,
                end_time: startTime,
                distance: 0,
                actions: endAction ? [startAction, endAction] : [startAction]
            }
        };
    }

    private resolveAgentLocation(
        agentIndex: number,
        agent: AgentData,
        boundary: "start" | "end"
    ): AgentLocationData | undefined {
        const locationIndex = boundary === "start" ? agent.start_location_index : agent.end_location_index;

        if (locationIndex !== undefined) {
            const indexedLocation = this.rawData.properties.params.locations[locationIndex];

            if (!indexedLocation || !indexedLocation.location) {
                throw new Error(
                    `Agent ${agentIndex} has invalid ${boundary}_location_index ${locationIndex}`
                );
            }

            return {
                location: indexedLocation.location,
                locationIndex,
                locationId: indexedLocation.id
            };
        }

        const location = boundary === "start" ? agent.start_location : agent.end_location;
        if (location) {
            return { location };
        }

        return undefined;
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

    getAgentWaypoints(agentIndex: number): WaypointResponseData[] {
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
