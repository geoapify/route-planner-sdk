import { AgentData, ShipmentData } from '../../../../../models/interfaces';
import { 
    AgentPickupCapacityExceeded, 
    AgentDeliveryCapacityExceeded,
    TimeWindowViolation,
    BreakViolation,
    ViolationError
} from '../../../../../models/entities/route-editor-exceptions';
import { ConstraintValidationHelper } from './constraint-validation-helper';

/**
 * Validates constraints between agents and shipments.
 * Performs simple validations that are always correct (no false positives).
 */
export class ShipmentValidationHelper {

    static validateAll(agent: AgentData, shipments: ShipmentData[], agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        
        for (const shipment of shipments) {
            const shipmentIssues = this.validateSingle(agent, shipment, agentIndex);
            issues.push(...shipmentIssues);
        }
        
        const capacityIssues = this.validateCapacity(agent, shipments, agentIndex);
        issues.push(...capacityIssues);
        
        return issues;
    }

    static validateSingle(agent: AgentData, shipment: ShipmentData, agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        
        const capabilityError = ConstraintValidationHelper.checkCapabilities(agent, shipment.requirements, agentIndex);
        if (capabilityError) issues.push(capabilityError);
        
        const pickupTimeError = this.checkPickupTimeWindows(agent, shipment, agentIndex);
        if (pickupTimeError) issues.push(pickupTimeError);
        
        const deliveryTimeError = this.checkDeliveryTimeWindows(agent, shipment, agentIndex);
        if (deliveryTimeError) issues.push(deliveryTimeError);
        
        const pickupBreakError = this.checkPickupBreaks(agent, shipment, agentIndex);
        if (pickupBreakError) issues.push(pickupBreakError);
        
        const deliveryBreakError = this.checkDeliveryBreaks(agent, shipment, agentIndex);
        if (deliveryBreakError) issues.push(deliveryBreakError);
        
        return issues;
    }

    static validateCapacity(agent: AgentData, shipments: ShipmentData[], agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        const total = shipments.reduce((sum, s) => sum + (s.amount ?? 0), 0);
        
        if (agent.pickup_capacity !== undefined && total > agent.pickup_capacity) {
            issues.push(new AgentPickupCapacityExceeded(
                `Total shipment amount (${total}) exceeds agent pickup capacity (${agent.pickup_capacity})`,
                agentIndex,
                total,
                agent.pickup_capacity
            ));
        }
        
        if (agent.delivery_capacity !== undefined && total > agent.delivery_capacity) {
            issues.push(new AgentDeliveryCapacityExceeded(
                `Total shipment amount (${total}) exceeds agent delivery capacity (${agent.delivery_capacity})`,
                agentIndex,
                total,
                agent.delivery_capacity
            ));
        }
        
        return issues;
    }

    private static checkPickupTimeWindows(agent: AgentData, shipment: ShipmentData, agentIndex: number): TimeWindowViolation | null {
        const pickupWindows = shipment.pickup?.time_windows;
        if (!pickupWindows?.length) return null;
        
        return ConstraintValidationHelper.checkTimeWindowOverlap(agent, pickupWindows, 'shipment pickup', agentIndex);
    }

    private static checkDeliveryTimeWindows(agent: AgentData, shipment: ShipmentData, agentIndex: number): TimeWindowViolation | null {
        const deliveryWindows = shipment.delivery?.time_windows;
        if (!deliveryWindows?.length) return null;
        
        return ConstraintValidationHelper.checkTimeWindowOverlap(agent, deliveryWindows, 'shipment delivery', agentIndex);
    }

    private static checkPickupBreaks(agent: AgentData, shipment: ShipmentData, agentIndex: number): BreakViolation | null {
        const pickupWindows = shipment.pickup?.time_windows;
        if (!pickupWindows?.length) return null;
        
        return ConstraintValidationHelper.checkBreakConflict(agent, pickupWindows, 'shipment pickup', agentIndex);
    }

    private static checkDeliveryBreaks(agent: AgentData, shipment: ShipmentData, agentIndex: number): BreakViolation | null {
        const deliveryWindows = shipment.delivery?.time_windows;
        if (!deliveryWindows?.length) return null;
        
        return ConstraintValidationHelper.checkBreakConflict(agent, deliveryWindows, 'shipment delivery', agentIndex);
    }
}

