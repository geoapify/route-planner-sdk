export interface JobData {
    location?: [number, number];
    location_index?: number;
    priority?: number;
    duration?: number;
    pickup_amount?: number;
    delivery_amount?: number;
    requirements: string[];
    time_windows: [number, number][];
    id?: string;
    description?: string;
}