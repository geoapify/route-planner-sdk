import {GeocodingFeatureProperties} from "./geocoding-features-properties";

export interface AgentLine {
    startLocation: GeocodingFeatureProperties;
    endLocation?: GeocodingFeatureProperties;
    pickipCapacity?: number;
    deliveryCapacity?: number;
    capabilities?: string[];
    timeframeWindows?: [number, number][];
    color: string;
}
