import { DistanceUnitType, TrafficType, TravelMode } from "../types";
import { RouteType } from "../types/route-type";
import { JobData } from "./nested/input/job-data";
import { AgentData } from "./nested/input/agent-data";
import { ShipmentData } from "./nested/input/shipment-data";
import { LocationData } from "./nested/input/location-data";
import { AvoidData } from "./nested/input/avoid-data";

export interface RoutePlannerInputData {
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