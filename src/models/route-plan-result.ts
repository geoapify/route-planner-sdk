export interface RoutePlanResult {
    type: string;
    properties: {
        mode: string;
        params: {
            mode: string;
            agents: RPAgent[];
            jobs: RPJob[];
        }
    }
    features: RPFeature[];
}

export interface RPAgent {
    id: string;
    location: [number, number];
}

export interface RPJob {
    id: string;
    location: [number, number];
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
    // TODO: double check total_time
    total_time?: number;
    distance: number;
    mode: string;
    legs: RPLeg[];
    actions: RPAction[];
    waypoints: RPWaypoint[];
}

export interface RPFeature {
    geometry: RPGeometry
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
    // TODO: double check shipment_index/shipment_id
    shipment_index?: number;
    shipment_id?: number;
    job_index: number;
    job_id: string;
    index: number;
    waypoint_index: number;
}

export interface RPWaypoint {
    original_location: [number, number];
    // TODO: double check original_location_index/original_location_id
    original_location_index?: number;
    original_location_id?: number;
    location: [number, number];
    start_time: number;
    duration: number;
    actions: RPAction[];
    prev_leg_index?: number;
    next_leg_index?: number;
}