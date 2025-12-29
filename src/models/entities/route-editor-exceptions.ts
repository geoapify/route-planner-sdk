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

export class AgentCapacityExceeded extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class AgentCapacityOverflow extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}

export class AgentOverloaded extends Error {
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

export class AgentOvertime extends Error {
    constructor(message: string, public agentId?: string, public agentIndex?: number) {
        super(message);
    }
}
