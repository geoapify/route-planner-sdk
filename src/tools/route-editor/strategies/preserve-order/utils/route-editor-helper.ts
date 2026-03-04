import { JobData, ShipmentData, ShipmentStepData } from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";

export interface WaypointLocationSourceData {
    location: [number, number];
    locationIndex?: number;
    locationId?: string;
}

/**
 * Helper for route editing: create actions, retrieve job/shipment data, remove items from agents
 */
export class RouteEditorHelper {

    static createJobAction(context: RouteResultEditorBase, jobIndex: number, waypointIndex: number): any {
        const job = this.getJobByIndex(context, jobIndex);
        return {
            index: 0,
            type: 'job',
            start_time: 0,
            duration: job.duration || 0,
            job_index: jobIndex,
            job_id: job.id,
            waypoint_index: waypointIndex
        };
    }

    static createShipmentAction(context: RouteResultEditorBase, shipmentIndex: number, type: 'pickup' | 'delivery', waypointIndex: number): any {
        const shipment = this.getShipmentByIndex(context, shipmentIndex);
        const duration = type === 'pickup' ? 
            (shipment.pickup?.duration || 0) : 
            (shipment.delivery?.duration || 0);
            
        return {
            index: 0,
            type: type,
            start_time: 0,
            duration: duration,
            shipment_index: shipmentIndex,
            shipment_id: shipment.id,
            waypoint_index: waypointIndex
        };
    }

    static getJobByIndex(context: RouteResultEditorBase, jobIndex: number): JobData {
        return context.getRawData().properties.params.jobs[jobIndex];
    }

    static getShipmentByIndex(context: RouteResultEditorBase, shipmentIndex: number): ShipmentData {
        return context.getRawData().properties.params.shipments[shipmentIndex];
    }

    static resolveShipmentStepLocation(context: RouteResultEditorBase, step: ShipmentStepData): [number, number] {
        return this.resolveShipmentStepWaypointLocationData(context, step).location;
    }

    static resolveShipmentStepWaypointLocationData(
        context: RouteResultEditorBase,
        step: ShipmentStepData
    ): WaypointLocationSourceData {
        if (step.location) {
            return { location: step.location };
        }
        
        if (step.location_index !== undefined) {
            const rawData = context.getRawData();
            const locations = rawData.properties.params.locations;
            const indexedLocation = locations[step.location_index];

            if (!indexedLocation?.location) {
                throw new Error(`Shipment step has invalid location_index ${step.location_index}`);
            }

            return {
                location: indexedLocation.location,
                locationIndex: step.location_index,
                locationId: indexedLocation.id
            };
        }
        
        throw new Error('Shipment step must have either location or location_index');
    }

    static resolveJobLocation(context: RouteResultEditorBase, job: JobData): [number, number] {
        return this.resolveJobWaypointLocationData(context, job).location;
    }

    static resolveJobWaypointLocationData(
        context: RouteResultEditorBase,
        job: JobData
    ): WaypointLocationSourceData {
        if (job.location) {
            return { location: job.location };
        }
        
        if (job.location_index !== undefined) {
            const rawData = context.getRawData();
            const locations = rawData.properties.params.locations;
            const indexedLocation = locations[job.location_index];

            if (!indexedLocation?.location) {
                throw new Error(`Job has invalid location_index ${job.location_index}`);
            }

            return {
                location: indexedLocation.location,
                locationIndex: job.location_index,
                locationId: indexedLocation.id
            };
        }
        
        throw new Error('Job must have either location or location_index');
    }
}
