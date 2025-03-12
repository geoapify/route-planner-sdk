import { DistanceUnitType, TrafficType, TravelMode } from "../types";
import { RouteType } from "../types/route-type";
import { JobData } from "./nested/job-data";
import { AgentData } from "./nested/agent-data";
import { ShipmentData } from "./nested/shipment-data";
import { LocationData } from "./nested/location-data";
import { AvoidData } from "./nested/avoid-data";

export interface RoutePlannerData {
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