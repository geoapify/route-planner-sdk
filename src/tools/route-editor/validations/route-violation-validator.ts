import {
    ActionResponseData,
    AgentData,
    JobData,
    ShipmentData,
    ViolationError,
    TimeWindowViolation,
    BreakViolation,
    AgentPickupCapacityExceeded,
    AgentDeliveryCapacityExceeded,
    AgentMissingCapability, RoutePlannerResultResponseDataExtended
} from '../../../models';
import {RouteResultEditorBase} from "../route-result-editor-base";

type TimeWindow = [number, number];

export class RouteViolationValidator {

    private static readonly ACTION_TYPE_PICKUP = 'pickup';
    private static readonly ACTION_TYPE_DELIVERY = 'delivery';
    private static readonly ACTION_TYPE_START = 'start';
    private static readonly ACTION_TYPE_END = 'end';
    private static readonly ACTION_TYPE_BREAK = 'break';
    private static readonly ACTION_TYPE_JOB = 'job';

    static validate(context: RouteResultEditorBase, agentIndex: number): void {
        const rawData = context.getRawData();

        const violations: ViolationError[] = [];

        let timeWindowViolations = this.validateTimeWindows(context, agentIndex);
        violations.push(...timeWindowViolations);
        let breakViolations = this.validateBreaks(context, agentIndex);
        violations.push(...breakViolations);
        let capacityViolations = this.validateCapacity(context, agentIndex);
        violations.push(...capacityViolations);
        let capabilityViolations = this.validateCapabilities(context, agentIndex);
        violations.push(...capabilityViolations);

        this.addViolationsToResult(rawData, agentIndex, violations);
    }

    private static validateTimeWindows(context: RouteResultEditorBase, agentIndex: number): ViolationError[] {
        const result: ViolationError[] = [];
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        const actions = context.getAgentActions(agentIndex);

        for (const action of actions) {
            if (
                action.type === this.ACTION_TYPE_START ||
                action.type === this.ACTION_TYPE_END ||
                action.type === this.ACTION_TYPE_BREAK
            ) {
                continue;
            }

            const actionTimeWindow = this.getActionTimeWindow(action);

            const itemTimeWindows = this.getItemTimeWindows(rawData, action);
            if (itemTimeWindows.length > 0 && !this.isWithinAnyTimeWindow(actionTimeWindow, itemTimeWindows)) {
                result.push(new TimeWindowViolation(`Action at time ${action.start_time} is outside ${action.type} time windows`, agentIndex));
            }

            if (agent.time_windows?.length > 0 && !this.isWithinAnyTimeWindow(actionTimeWindow, agent.time_windows)) {
                result.push(new TimeWindowViolation(`Action at time ${action.start_time} is outside agent time windows`, agentIndex));
            }
        }

        return result;
    }

    private static validateBreaks(context: RouteResultEditorBase, agentIndex: number): ViolationError[] {
        const result: ViolationError[] = [];
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        const actions = context.getAgentActions(agentIndex);

        if (!agent.breaks?.length) {
            return result;
        }

        for (const action of actions) {
            if (
                action.type === this.ACTION_TYPE_START ||
                action.type === this.ACTION_TYPE_END ||
                action.type === this.ACTION_TYPE_BREAK
            ) {
                continue;
            }

            const actionTimeWindow = this.getActionTimeWindow(action);

            for (const breakPeriod of agent.breaks) {
                if (this.intersectsAnyTimeWindow(actionTimeWindow, breakPeriod.time_windows)) {
                    result.push(new BreakViolation(`Action at time ${action.start_time} conflicts with agent break`, agentIndex));
                    break;
                }
            }
        }

        return result;
    }

    private static validateCapacity(context: RouteResultEditorBase, agentIndex: number): ViolationError[] {
        const violations: ViolationError[] = [];
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        const actions = context.getAgentActions(agentIndex);
        let totalPickupAmount = 0;
        let totalDeliveryAmount = 0;

        for (const action of actions) {
            if (action.type === this.ACTION_TYPE_PICKUP) {
                totalPickupAmount += this.getActionAmount(rawData, action);
            } else if (action.type === this.ACTION_TYPE_DELIVERY) {
                totalDeliveryAmount += this.getActionAmount(rawData, action);
            } else if (action.type === this.ACTION_TYPE_JOB) {
                totalPickupAmount += this.getJobPickupAmount(rawData, action);
                totalDeliveryAmount += this.getJobDeliveryAmount(rawData, action);
            }
        }

        const pickupCapacity = this.normalizeCapacity(agent.pickup_capacity);
        if (agent.pickup_capacity !== undefined && pickupCapacity === undefined) {
            violations.push(new AgentPickupCapacityExceeded(
                `Agent pickup capacity is invalid (${String(agent.pickup_capacity)})`,
                agentIndex,
                totalPickupAmount,
                0
            ));
        } else if (pickupCapacity !== undefined && totalPickupAmount > pickupCapacity) {
            violations.push(new AgentPickupCapacityExceeded(
                `Total pickup amount (${totalPickupAmount}) exceeds agent pickup capacity (${pickupCapacity})`,
                agentIndex,
                totalPickupAmount,
                pickupCapacity
            ));
        }

        const deliveryCapacity = this.normalizeCapacity(agent.delivery_capacity);
        if (agent.delivery_capacity !== undefined && deliveryCapacity === undefined) {
            violations.push(new AgentDeliveryCapacityExceeded(
                `Agent delivery capacity is invalid (${String(agent.delivery_capacity)})`,
                agentIndex,
                totalDeliveryAmount,
                0
            ));
        } else if (deliveryCapacity !== undefined && totalDeliveryAmount > deliveryCapacity) {
            violations.push(new AgentDeliveryCapacityExceeded(
                `Total delivery amount (${totalDeliveryAmount}) exceeds agent delivery capacity (${deliveryCapacity})`,
                agentIndex,
                totalDeliveryAmount,
                deliveryCapacity
            ));
        }

        return violations;
    }

    private static validateCapabilities(context: RouteResultEditorBase, agentIndex: number): ViolationError[] {
        const violations: ViolationError[] = [];
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        const actions = context.getAgentActions(agentIndex);

        const missingCapabilities = new Set<string>();

        for (const action of actions) {
            if (action.job_index !== undefined) {
                const job = rawData.properties.params.jobs?.[action.job_index];
                this.collectMissingRequirements(agent, job?.requirements, missingCapabilities);
            }
            if (action.shipment_index !== undefined) {
                const shipment = rawData.properties.params.shipments?.[action.shipment_index];
                this.collectMissingRequirements(agent, shipment?.requirements, missingCapabilities);
            }
        }

        if (missingCapabilities.size === 0) {
            return violations;
        }

        const missing = Array.from(missingCapabilities);
        const message = missing.length === 1
            ? `Agent is missing required capability: '${missing[0]}'`
            : `Agent is missing required capabilities: ${missing.join(', ')}`;
        violations.push(new AgentMissingCapability(message, agentIndex, missing));

        return violations;
    }

    private static collectMissingRequirements(agent: AgentData, requirements: string[] | undefined, target: Set<string>): void {
        if (!requirements?.length) {
            return;
        }

        for (const requirement of requirements) {
            if (!agent.capabilities?.includes(requirement)) {
                target.add(requirement);
            }
        }
    }

    private static getActionTimeWindow(action: ActionResponseData): TimeWindow {
        return [action.start_time, action.start_time + (action.duration || 0)];
    }

    private static getItemTimeWindows(rawData: RoutePlannerResultResponseDataExtended,
                                      action: ActionResponseData): TimeWindow[] {
        if (action.job_index !== undefined) {
            const job: JobData = rawData.properties.params.jobs[action.job_index];
            return job?.time_windows || [];
        }

        if (action.shipment_index !== undefined) {
            const shipment: ShipmentData = rawData.properties.params.shipments[action.shipment_index];
            if (action.type === this.ACTION_TYPE_PICKUP) {
                return shipment?.pickup?.time_windows || [];
            }
            if (action.type === this.ACTION_TYPE_DELIVERY) {
                return shipment?.delivery?.time_windows || [];
            }
        }

        return [];
    }

    private static getActionAmount(rawData: any, action: ActionResponseData): number {
        if (action.shipment_index !== undefined) {
            const shipment: ShipmentData = rawData.properties.params.shipments[action.shipment_index];
            return this.normalizeAmount(shipment?.amount);
        }
        return 0;
    }

    private static getJobPickupAmount(rawData: any, action: ActionResponseData): number {
        if (action.job_index !== undefined) {
            const job: JobData = rawData.properties.params.jobs[action.job_index];
            return this.normalizeAmount(job?.pickup_amount);
        }
        return 0;
    }

    private static getJobDeliveryAmount(rawData: any, action: ActionResponseData): number {
        if (action.job_index !== undefined) {
            const job: JobData = rawData.properties.params.jobs[action.job_index];
            return this.normalizeAmount(job?.delivery_amount);
        }
        return 0;
    }

    private static normalizeAmount(value: unknown): number {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
            return 0;
        }
        return value;
    }

    private static normalizeCapacity(value: unknown): number | undefined {
        if (value === undefined) {
            return undefined;
        }
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
            return undefined;
        }
        return value;
    }

    private static isWithinAnyTimeWindow(actionWindow: TimeWindow, timeWindows: TimeWindow[]): boolean {
        const [actionStart, actionEnd] = actionWindow;
        return timeWindows.some(([windowStart, windowEnd]) =>
            actionStart >= windowStart && actionEnd <= windowEnd
        );
    }

    private static intersectsAnyTimeWindow(actionWindow: TimeWindow, timeWindows: TimeWindow[]): boolean {
        const [actionStart, actionEnd] = actionWindow;
        return timeWindows.some(([windowStart, windowEnd]) =>
            actionStart < windowEnd && actionEnd > windowStart
        );
    }

    private static addViolationsToResult(rawData: any, agentIndex: number, violations: ViolationError[]): void {
        rawData.properties.violations = (rawData.properties.violations || []).filter(
            (violation: ViolationError) => violation.agentIndex !== agentIndex
        );

        if (violations.length === 0) {
            if (!rawData.properties.violations.length) {
                delete rawData.properties.violations;
            }
            return;
        }

        rawData.properties.violations.push(...violations);
    }
}
