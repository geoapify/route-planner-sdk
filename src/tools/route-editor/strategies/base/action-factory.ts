import { JobData, ShipmentData } from "../../../../models";
import { StrategyContext } from "./strategy-context";

/**
 * Factory for creating action objects
 */
export class ActionFactory {

    static createJobAction(context: StrategyContext, jobIndex: number, waypointIndex: number): any {
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

    static createShipmentAction(context: StrategyContext, shipmentIndex: number, type: 'pickup' | 'delivery', waypointIndex: number): any {
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

    static getJobByIndex(context: StrategyContext, jobIndex: number): JobData {
        return context.getRawData().properties.params.jobs[jobIndex];
    }

    static getShipmentByIndex(context: StrategyContext, shipmentIndex: number): ShipmentData {
        return context.getRawData().properties.params.shipments[shipmentIndex];
    }
}

