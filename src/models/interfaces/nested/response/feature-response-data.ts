import { GeometryResponseData } from "./geometry-response-data";
import { PropertiesResponseData } from "./properties-response-data";

export interface FeatureResponseData {
    geometry: GeometryResponseData
    type: string;
    properties: PropertiesResponseData
}