import { GeometryResponseData } from "./geometry-response-data";
import { AgentPlanResponceData } from "./properties-response-data";

export interface FeatureResponseData {
    geometry: GeometryResponseData
    type: string;
    properties: AgentPlanResponceData
}
