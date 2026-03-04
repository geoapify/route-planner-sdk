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
} from '../../../../../models';
import {RouteResultEditorBase} from "../../../route-result-editor-base";

type TimeWindow = [number, number];

export class RouteViolationValidator {

    private static readonly ACTION_TYPE_PICKUP = 'pickup';
    private static readonly ACTION_TYPE_DELIVERY = 'delivery';
    private static readonly ACTION_TYPE_START = 'start';
    private static readonly ACTION_TYPE_END = 'end';
    private static readonly ACTION_TYPE_JOB = 'job';

    static validate(context: RouteResultEditorBase, agentIndex: number): void {
        const rawData = context.getRawData();
        const agent = rawData.properties.params.agents[agentIndex];
        const actions = context.getAgentActions(agentIndex);

        const violations: ViolationError[] = [];

        let timeWindowViolations = this.validateTimeWindows(context, agent, actions, agentIndex);
        violations.push(...timeWindowViolations);
        let breakViolations = this.validateBreaks(agent, actions, agentIndex);
        violations.push(...breakViolations);
        let capacityViolations = this.validateCapacity(context, agent, actions, agentIndex);
        violations.push(...capacityViolations);
        let capabilityViolations = this.validateCapabilities(context, agent, actions, agentIndex);
        violations.push(...capabilityViolations);

        this.addViolationsToResult(rawData, agentIndex, violations);
    }

    private static validateTimeWindows(context: RouteResultEditorBase, agent: AgentData,
                                       actions: ActionResponseData[], agentIndex: number): ViolationError[] {
        const result: ViolationError[] = [];
        const rawData = context.getRawData();

        for (const action of actions) {
            if (action.type === this.ACTION_TYPE_START || action.type === this.ACTION_TYPE_END) {
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

    private static validateBreaks(agent: AgentData, actions: ActionResponseData[],
                                  agentIndex: number): ViolationError[] {
        const result: ViolationError[] = [];

        if (!agent.breaks?.length) {
            return result;
        }

        for (const action of actions) {
            if (action.type === this.ACTION_TYPE_START || action.type === this.ACTION_TYPE_END) {
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

    private static validateCapacity(context: RouteResultEditorBase, agent: AgentData,
                                    actions: ActionResponseData[], agentIndex: number): ViolationError[] {
        const violations: ViolationError[] = [];
        const rawData = context.getRawData();

        const initialDeliveryLoad = this.calculateInitialDeliveryLoad(rawData, actions);

        if (agent.delivery_capacity !== undefined && initialDeliveryLoad > agent.delivery_capacity) {
            violations.push(new AgentDeliveryCapacityExceeded(`Initial delivery load ${initialDeliveryLoad} exceeds agent delivery capacity ${agent.delivery_capacity}`,
                agentIndex, initialDeliveryLoad, agent.delivery_capacity));
        }

        let currentPickupLoad = 0;
        let pickupViolationAdded = false;

        for (const action of actions) {
            if (action.type === this.ACTION_TYPE_PICKUP) {
                const amount = this.getActionAmount(rawData, action);
                currentPickupLoad += amount;
            } else if (action.type === this.ACTION_TYPE_DELIVERY) {
                const amount = this.getActionAmount(rawData, action);
                currentPickupLoad -= amount;
            } else if (action.type === this.ACTION_TYPE_JOB) {
                currentPickupLoad += this.getJobPickupAmount(rawData, action);
            }

            if (!pickupViolationAdded && agent.pickup_capacity !== undefined &&
                currentPickupLoad > agent.pickup_capacity) {
                violations.push(new AgentPickupCapacityExceeded(`Pickup capacity exceeded at action ${action.index}: load ${currentPickupLoad} > capacity ${agent.pickup_capacity}`,
                    agentIndex, currentPickupLoad, agent.pickup_capacity));
                pickupViolationAdded = true;
            }
        }

        return violations;
    }

    private static calculateInitialDeliveryLoad(rawData: any, actions: ActionResponseData[]): number {
        let totalDeliveryLoad = 0;

        for (const action of actions) {
            if (action.type === this.ACTION_TYPE_JOB) {
                totalDeliveryLoad += this.getJobDeliveryAmount(rawData, action);
            }
        }

        return totalDeliveryLoad;
    }

    private static validateCapabilities(context: RouteResultEditorBase, agent: AgentData,
                                        actions: ActionResponseData[], agentIndex: number): ViolationError[] {
        const violations: ViolationError[] = [];
        const rawData = context.getRawData();

        const jobIndexes = new Set<number>();
        const shipmentIndexes = new Set<number>();

        for (const action of actions) {
            if (action.job_index !== undefined) {
                jobIndexes.add(action.job_index);
            }
            if (action.shipment_index !== undefined) {
                shipmentIndexes.add(action.shipment_index);
            }
        }

        for (const jobIndex of jobIndexes) {
            const job = rawData.properties.params.jobs[jobIndex];
            if (!job.requirements?.length) {
                continue;
            }
            this.checkRequirements(agent, job.requirements, agentIndex, violations);
        }

        for (const shipmentIndex of shipmentIndexes) {
            const shipment = rawData.properties.params.shipments[shipmentIndex];
            if (!shipment.requirements?.length) {
                continue;
            }
            this.checkRequirements(agent, shipment.requirements, agentIndex, violations);
        }

        return violations;
    }

    private static checkRequirements(agent: AgentData, requirements: string[], agentIndex: number,
                                     violations: ViolationError[]): void {
        const missing = requirements.filter(req => !agent.capabilities?.includes(req));
        if (missing.length > 0) {
            const message = missing.length === 1 ? `Agent is missing required capability: '${missing[0]}'` :
                `Agent is missing required capabilities: ${missing.join(', ')}`;
            violations.push(new AgentMissingCapability(message, agentIndex, missing));
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
            return shipment?.amount || 0;
        }
        return 0;
    }

    private static getJobPickupAmount(rawData: any, action: ActionResponseData): number {
        if (action.job_index !== undefined) {
            const job: JobData = rawData.properties.params.jobs[action.job_index];
            return job?.pickup_amount || 0;
        }
        return 0;
    }

    private static getJobDeliveryAmount(rawData: any, action: ActionResponseData): number {
        if (action.job_index !== undefined) {
            const job: JobData = rawData.properties.params.jobs[action.job_index];
            return job?.delivery_amount || 0;
        }
        return 0;
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
