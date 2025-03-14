export interface RouteAction {
    type: string;
    start_time: number;
    duration: number;
    shipment_index?: number;
    shipment_id?: string;
    location_index?: number;
    location_id?: number;
    job_index?: number;
    job_id?: string;
    index?: number;
    waypoint_index: number;
}