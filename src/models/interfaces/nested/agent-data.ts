import { BreakData } from "./break-data";

export interface AgentData{
    start_location?: [number, number];
    start_location_index?: number;
    end_location?: [number, number];
    end_location_index?: number;
    pickup_capacity?: number;
    delivery_capacity?: number;
    capabilities: string[];
    time_windows: [number, number][];
    breaks: BreakData[];
    id?: string;
    description?: string;
}
