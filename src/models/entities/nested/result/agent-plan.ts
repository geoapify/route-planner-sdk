import { RouteLeg } from "./route-leg";
import { AgentData, AgentPlanData, RoutingOptions, RoutingOptionsExtended } from "../../../interfaces";
import { RouteAction } from "./route-action";
import { Waypoint } from "./waypoint";
import { RoutePlannerCallOptions } from "../../../interfaces/route-planner-call-options";

export class AgentPlan {
    constructor(private readonly raw: AgentPlanData,
                private readonly agentInputData: AgentData,
                private readonly routingOptions: RoutingOptions,
                private readonly callOptions: RoutePlannerCallOptions) {
        if (!raw) {
            throw new Error("AgentSolutionData is undefined");
        }
     }

    getRaw(): AgentPlanData {
        return this.raw;
    }

    getAgentIndex(): number {
        return this.raw.agentIndex;
    }

    getAgentId(): string {
        return this.raw.agentId;
    }

    getTime(): number {
        return this.raw.time;
    }

    getStartTime(): number {
        return this.raw.start_time;
    }

    getEndTime(): number {
        return this.raw.end_time;
    }

    getDistance(): number {
        return this.raw.distance;
    }

    getMode(): string {
        return this.raw.mode;
    }

    getLegs(): RouteLeg[] {
        return this.raw.legs.map((leg) => new RouteLeg(leg));
    }

    getActions(): RouteAction[] {
        return this.raw.actions.map((action) => new RouteAction(action));
    }

    getWaypoints(): Waypoint[] {
        return this.raw.waypoints.map((waypoint) => new Waypoint(waypoint));
    }

    getPlannedShipments(): number[] {
        return [...new Set( this.raw.actions.filter(action => typeof action.shipment_index !== 'undefined').map(action => {
            return action.shipment_index as number
        }))]
    }

    getPlannedJobs(): number[] {
        return [...new Set( this.raw.actions.filter(action => typeof action.job_index !== 'undefined').map(action => {
            return action.job_index as number
        }))]
    }

    getAgentInputData(): AgentData | undefined {
        return this.agentInputData;
    }

    containsShipment(shipmentIdOrIndex: string | number) {
        return this.getActions().some(action => action.getShipmentIndex() === shipmentIdOrIndex 
                    || action.getShipmentId() === shipmentIdOrIndex);
    }

    containsJob(jonIdOrIndex: string | number) {
        return this.getActions().some(action => action.getJobIndex() === jonIdOrIndex 
                    || action.getJobId() === jonIdOrIndex);
    }

    /**
     * Retrieves the route for a specific agent.
     * @param agentIdOrIndex - The ID or index of the agent.
     * @param options - The routing options.
     */
    async getRoute(routingOptions?: RoutingOptionsExtended): Promise<any | undefined> {
        const waypointLocations = this.getWaypoints().map((waypoint) => waypoint.getLocation());
        const waypoints = waypointLocations.map((location) => "lonlat:" + location).join("|");
        if (waypoints.length === 0) return undefined;

        const response = await fetch(
            this.constructRoutingRequest(
                waypoints,
                routingOptions || this.routingOptions,
                this.callOptions
            )
        );
        const result = await response.json();
        const feature = result?.features?.[0];

        if (!feature) {
            return {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: waypointLocations
                },
                properties: {
                    agent_index: this.getAgentIndex(),
                    agent_id: this.getAgentId()
                }
            };
        }

        feature.properties = {
            ...(feature.properties || {}),
            agent_index: this.getAgentIndex(),
            agent_id: this.getAgentId()
        };
        return feature;
    }

    private constructRoutingRequest(waypoints: string,
                                    options: RoutingOptionsExtended,
                                    callOptions: RoutePlannerCallOptions) {
        let url = `${callOptions.baseUrl}/v1/routing?waypoints=${waypoints}&apiKey=${callOptions.apiKey}`;
        
        if(options.mode) {
            url += `&mode=${options.mode}`;
        }
        if(options.type) {
            url += `&type=${options.type}`;
        }
        if(options.units) {
            url += `&units=${options.units}`;
        }
        if(options.lang) {
            url += `&lang=${options.lang}`;
        }
        if(options.avoid && options.avoid.length > 0) {
            url += `&avoid=${options.avoid.join('|')}`;
        }
        if(options.details && options.details.length > 0) {
            url += `&details=${options.details.join(',')}`;
        }
        if(options.traffic) {
            url += `&traffic=${options.traffic}`;
        }
        if(options.max_speed) {
            url += `&max_speed=${options.max_speed}`;
        }
        return url;
    }

}
