import {AvoidType, DistanceUnitType, RouteType, TrafficType, TravelMode} from "../types";
import {RouteDetailsType} from "../types/route-details-type";

export interface RoutingOptions {
    mode: TravelMode;
    type?: RouteType;
    units?: DistanceUnitType;
    lang?: string;
    avoid?: AvoidType[];
    details?: RouteDetailsType[];
    traffic?: TrafficType;
    max_speed?: number;
}
