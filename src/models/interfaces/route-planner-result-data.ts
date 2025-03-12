import { AgentData } from "./nested/agent-data";
import { JobData } from "./nested/job-data";
import { ShipmentData } from "./nested/shipment-data";
import { LocationData } from "./nested/location-data";
import { AvoidData } from "./nested/avoid-data";

export interface RoutePlannerResultData {
    type: string;
    properties: {
        mode: string;
        params: {
            mode?: string;
            agents: AgentData[];
            jobs: JobData[];
            shipments: ShipmentData[];
            locations: LocationData[];
            avoid: AvoidData[];
            traffic?: string;
            type?: string;
            max_speed?: number;
            units?: string;
        }
        issues: {
            unassigned_agents: number[];
            unassigned_jobs: number[];
            unassigned_shipments: number[];
        }
    }
    features: RPFeature[];
}

interface RPGeometry {
    type: string;
    coordinates: [number, number][];
}

interface RPProperties {
    agent_index: number;
    agent_id: string;
    time: number;
    start_time: number;
    end_time: number;
    distance: number;
    mode: string;
    legs?: RPLeg[];
    actions: RPAction[];
    waypoints: RPWaypoint[];
}

export interface RPFeature {
    geometry: RPGeometry
    type: string;
    properties: RPProperties
}

export interface RPLeg {
    distance: number;
    time: number;
    steps: RPLegStep[];
    from_waypoint_index: number;
    to_waypoint_index: number;
}

export interface RPLegStep {
    distance: number;
    time: number;
    from_index: number;
    to_index: number;
}

export interface RPAction {
    type: string;
    start_time: number;
    duration: number;
    shipment_index?: number;
    shipment_id?: number;
    location_index?: number;
    location_id?: number;
    job_index?: number;
    job_id?: string;
    index?: number;
    waypoint_index: number;
}

export interface RPWaypoint {
    original_location: [number, number];
    original_location_index?: number;
    original_location_id?: number;
    location: [number, number];
    start_time: number;
    duration: number;
    actions: RPAction[];
    prev_leg_index?: number;
    next_leg_index?: number;
}