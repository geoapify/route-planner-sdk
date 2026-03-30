import { GeometryResponseData } from "./geometry-response-data";
import { AgentPlanData } from "./properties-response-data";

export interface FeatureResponseData {
    geometry: GeometryResponseData
    type: string;
    properties: AgentPlanData
}
