import { JobData, ShipmentData, ShipmentStepData } from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";

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

    static removeJobsFromAgents(context: RouteResultEditorBase, jobIndexes: number[]): void {
        const rawData = context.getRawData();
        for (const jobIndex of jobIndexes) {
            for (const feature of rawData.features) {
                const actions = feature.properties.actions;
                const jobActionIndex = actions.findIndex((a: any) => a.job_index === jobIndex);
                if (jobActionIndex !== -1) {
                    actions.splice(jobActionIndex, 1);
                    context.reindexActions(actions);
                }
            }
        }
    }

    static removeShipmentsFromAgents(context: RouteResultEditorBase, shipmentIndexes: number[]): void {
        const rawData = context.getRawData();
        for (const shipmentIndex of shipmentIndexes) {
            for (const feature of rawData.features) {
                const actions = feature.properties.actions;
                for (let i = actions.length - 1; i >= 0; i--) {
                    if (actions[i].shipment_index === shipmentIndex) {
                        actions.splice(i, 1);
                    }
                }
                context.reindexActions(actions);
            }
        }
    }

    static resolveShipmentStepLocation(context: RouteResultEditorBase, step: ShipmentStepData): [number, number] {
        if (step.location) {
            return step.location;
        }
        
        if (step.location_index !== undefined) {
            const rawData = context.getRawData();
            const locations = rawData.properties.params.locations;
            return locations[step.location_index].location!;
        }
        
        throw new Error('Shipment step must have either location or location_index');
    }

    static resolveJobLocation(context: RouteResultEditorBase, job: JobData): [number, number] {
        if (job.location) {
            return job.location;
        }
        
        if (job.location_index !== undefined) {
            const rawData = context.getRawData();
            const locations = rawData.properties.params.locations;
            return locations[job.location_index].location!;
        }
        
        throw new Error('Job must have either location or location_index');
    }
}

