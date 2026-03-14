export interface ActionResponseData {
    type: string;
    start_time: number;
    duration: number;
    index: number;
    shipment_index?: number;
    shipment_id?: string;
    location_index?: number;
    location_id?: string;
    job_index?: number;
    job_id?: string;
    waypoint_index?: number;
}