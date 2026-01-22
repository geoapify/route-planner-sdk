import { DistanceUnitType, TrafficType, TravelMode } from "../types";
import { RouteType } from "../types/route-type";
import { JobData } from "./nested/input/job-data";
import { AgentData } from "./nested/input/agent-data";
import { ShipmentData } from "./nested/input/shipment-data";
import { LocationData } from "./nested/input/location-data";
import { AvoidData } from "./nested/input/avoid-data";
import { RouteDetailsType } from "../types/route-details-type";

export interface RoutingOptionsExtended extends RoutingOptions {
    lang?: string;
    details?: RouteDetailsType[];
}
export interface RoutingOptions {
    mode?: TravelMode;
    type?: RouteType;
    avoid?: AvoidData[];
    traffic?: TrafficType;
    max_speed?: number;
    units?: DistanceUnitType;
}
export interface RoutePlannerInputData extends RoutingOptions {
    agents: AgentData[];
    jobs: JobData[];
    shipments: ShipmentData[];
    locations: LocationData[];
}