import { AgentData, JobData } from '../../../models/interfaces';
import { 
    AgentPickupCapacityExceeded, 
    AgentDeliveryCapacityExceeded,
    ViolationError
} from '../../../models/entities/route-editor-exceptions';
import { ConstraintValidationHelper } from './constraint-validation-helper';

/**
 * Validates constraints between agents and jobs.
 * Performs simple validations that are always correct (no false positives).
 */
export class JobValidationHelper {

    static validateAll(agent: AgentData, jobs: JobData[], agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        
        for (const job of jobs) {
            const jobIssues = this.validateSingle(agent, job, agentIndex);
            issues.push(...jobIssues);
        }
        
        const capacityIssues = this.validateCapacity(agent, jobs, agentIndex);
        issues.push(...capacityIssues);
        
        return issues;
    }

    static validateSingle(agent: AgentData, job: JobData, agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        
        const capabilityError = ConstraintValidationHelper.checkCapabilities(agent, job.requirements, agentIndex);
        if (capabilityError) issues.push(capabilityError);
        
        const timeWindowError = ConstraintValidationHelper.checkTimeWindowOverlap(agent, job.time_windows, 'job', agentIndex);
        if (timeWindowError) issues.push(timeWindowError);
        
        const breakError = ConstraintValidationHelper.checkBreakConflict(agent, job.time_windows, 'job', agentIndex);
        if (breakError) issues.push(breakError);
        
        return issues;
    }

    static validateCapacity(agent: AgentData, jobs: JobData[], agentIndex: number): ViolationError[] {
        const issues: ViolationError[] = [];
        
        const pickupError = this.checkPickupCapacity(agent, jobs, agentIndex);
        if (pickupError) issues.push(pickupError);
        
        const deliveryError = this.checkDeliveryCapacity(agent, jobs, agentIndex);
        if (deliveryError) issues.push(deliveryError);
        
        return issues;
    }

    private static checkPickupCapacity(agent: AgentData, jobs: JobData[], agentIndex: number): AgentPickupCapacityExceeded | null {
        if (agent.pickup_capacity === undefined) return null;
        
        const total = jobs.reduce((sum, job) => sum + (job.pickup_amount ?? 0), 0);
        
        if (total > agent.pickup_capacity) {
            return new AgentPickupCapacityExceeded(
                `Total pickup amount (${total}) exceeds agent capacity (${agent.pickup_capacity})`,
                agentIndex
            );
        }
        
        return null;
    }

    private static checkDeliveryCapacity(agent: AgentData, jobs: JobData[], agentIndex: number): AgentDeliveryCapacityExceeded | null {
        if (agent.delivery_capacity === undefined) return null;
        
        const total = jobs.reduce((sum, job) => sum + (job.delivery_amount ?? 0), 0);
        
        if (total > agent.delivery_capacity) {
            return new AgentDeliveryCapacityExceeded(
                `Total delivery amount (${total}) exceeds agent capacity (${agent.delivery_capacity})`,
                agentIndex
            );
        }
        
        return null;
    }
}

