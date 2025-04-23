export interface GeocodingFeatureProperties {
    name?: string;
    country?: string;
    state?: string;
    postcode?: string;
    city?: string;
    street?: string;
    housenumber?: string;
    lat: number;
    lon: number;
    formatted?: string;
    distance?: number;
    address_line1?: string;
    address_line2?: string;
    place_id?: string;
    categories?: string[];
    result_type?: any;
    rank?: any;
}
