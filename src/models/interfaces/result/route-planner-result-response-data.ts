import { AgentData } from "../nested/agent-data";
import { JobData } from "../nested/job-data";
import { ShipmentData } from "../nested/shipment-data";
import { LocationData } from "../nested/location-data";
import { AvoidData } from "../nested/avoid-data";
import { FeatureResponseData } from "../nested/response/feature-response-data";

export interface RoutePlannerResultResponseData {
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
    features: FeatureResponseData[];
}