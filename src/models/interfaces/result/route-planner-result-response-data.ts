import { AgentData } from "../nested/input/agent-data";
import { JobData } from "../nested/input/job-data";
import { ShipmentData } from "../nested/input/shipment-data";
import { LocationData } from "../nested/input/location-data";
import { AvoidData } from "../nested/input/avoid-data";
import { FeatureResponseData } from "../nested/response/feature-response-data";
import {DistanceUnitType, RouteType, TrafficType, TravelMode} from "../../types";

export interface RoutePlannerResultResponseData {
    type: string;
    properties: {
        mode: string;
        params: {
            mode?: TravelMode;
            agents: AgentData[];
            jobs: JobData[];
            shipments: ShipmentData[];
            locations: LocationData[];
            avoid: AvoidData[];
            traffic?: TrafficType;
            type?: RouteType;
            max_speed?: number;
            units?: DistanceUnitType;
        }
        issues: {
            unassigned_agents: number[];
            unassigned_jobs: number[];
            unassigned_shipments: number[];
        }
    }
    features: FeatureResponseData[];
}