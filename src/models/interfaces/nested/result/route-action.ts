export interface RouteAction {
    index: number;
    type: string;
    start_time: number;
    duration: number;
    shipment_index?: number;
    shipment_id?: string;
    location_index?: number;
    location_id?: string;
    waypoint_index: number;
}