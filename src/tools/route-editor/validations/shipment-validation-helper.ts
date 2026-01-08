import { AgentData, ShipmentData } from '../../../models/interfaces';
import { 
    AgentPickupCapacityExceeded, 
    AgentDeliveryCapacityExceeded
} from '../../../models/entities/route-editor-exceptions';
import { ConstraintValidationHelper } from './constraint-validation-helper';

/**
 * Validates constraints between agents and shipments.
 * Performs simple validations that are always correct (no false positives).
 */
export class ShipmentValidationHelper {

    static validateAll(agent: AgentData, shipments: ShipmentData[]): Error[] {
        const issues: Error[] = [];
        
        for (const shipment of shipments) {
            const shipmentIssues = this.validateSingle(agent, shipment);
            issues.push(...shipmentIssues);
        }
        
        const capacityIssues = this.validateCapacity(agent, shipments);
        issues.push(...capacityIssues);
        
        return issues;
    }

    static validateSingle(agent: AgentData, shipment: ShipmentData): Error[] {
        const issues: Error[] = [];
        
        const capabilityError = ConstraintValidationHelper.checkCapabilities(agent, shipment.requirements);
        if (capabilityError) issues.push(capabilityError);
        
        const pickupTimeError = this.checkPickupTimeWindows(agent, shipment);
        if (pickupTimeError) issues.push(pickupTimeError);
        
        const deliveryTimeError = this.checkDeliveryTimeWindows(agent, shipment);
        if (deliveryTimeError) issues.push(deliveryTimeError);
        
        const pickupBreakError = this.checkPickupBreaks(agent, shipment);
        if (pickupBreakError) issues.push(pickupBreakError);
        
        const deliveryBreakError = this.checkDeliveryBreaks(agent, shipment);
        if (deliveryBreakError) issues.push(deliveryBreakError);
        
        return issues;
    }

    static validateCapacity(agent: AgentData, shipments: ShipmentData[]): Error[] {
        const issues: Error[] = [];
        const total = shipments.reduce((sum, s) => sum + (s.amount ?? 0), 0);
        
        if (agent.pickup_capacity !== undefined && total > agent.pickup_capacity) {
            issues.push(new AgentPickupCapacityExceeded(
                `Total shipment amount (${total}) exceeds agent pickup capacity (${agent.pickup_capacity})`,
                agent.id
            ));
        }
        
        if (agent.delivery_capacity !== undefined && total > agent.delivery_capacity) {
            issues.push(new AgentDeliveryCapacityExceeded(
                `Total shipment amount (${total}) exceeds agent delivery capacity (${agent.delivery_capacity})`,
                agent.id
            ));
        }
        
        return issues;
    }

    private static checkPickupTimeWindows(agent: AgentData, shipment: ShipmentData): Error | null {
        const pickupWindows = shipment.pickup?.time_windows;
        if (!pickupWindows?.length) return null;
        
        return ConstraintValidationHelper.checkTimeWindowOverlap(agent, pickupWindows, 'shipment pickup');
    }

    private static checkDeliveryTimeWindows(agent: AgentData, shipment: ShipmentData): Error | null {
        const deliveryWindows = shipment.delivery?.time_windows;
        if (!deliveryWindows?.length) return null;
        
        return ConstraintValidationHelper.checkTimeWindowOverlap(agent, deliveryWindows, 'shipment delivery');
    }

    private static checkPickupBreaks(agent: AgentData, shipment: ShipmentData): Error | null {
        const pickupWindows = shipment.pickup?.time_windows;
        if (!pickupWindows?.length) return null;
        
        return ConstraintValidationHelper.checkBreakConflict(agent, pickupWindows, 'shipment pickup');
    }

    private static checkDeliveryBreaks(agent: AgentData, shipment: ShipmentData): Error | null {
        const deliveryWindows = shipment.delivery?.time_windows;
        if (!deliveryWindows?.length) return null;
        
        return ConstraintValidationHelper.checkBreakConflict(agent, deliveryWindows, 'shipment delivery');
    }
}

