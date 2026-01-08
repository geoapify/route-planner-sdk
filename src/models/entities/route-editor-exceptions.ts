export class AgentPickupCapacityExceeded extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class AgentDeliveryCapacityExceeded extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class AgentMissingCapability extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class TimeWindowViolation extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class BreakViolation extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class ValidationErrors extends Error {
    constructor(public errors: Error[]) {
        const messages = errors.map(e => e.message).join('; ');
        super(`Validation failed: ${messages}`);
        this.name = 'ValidationErrors';
    }
}
