export class Violation {
    name: string;
    message: string;

    constructor(message: string, public readonly agentIndex: number) {
        this.message = message;
        this.name = 'Violation';
    }

    toString(): string {
        return this.message;
    }
}
export class AgentPickupCapacityExceeded extends Violation {
    constructor(
        message: string, 
        agentIndex: number,
        public readonly totalAmount: number,
        public readonly capacity: number
    ) {
        super(message, agentIndex);
        this.name = 'AgentPickupCapacityExceeded';
    }
}

export class AgentDeliveryCapacityExceeded extends Violation {
    constructor(
        message: string, 
        agentIndex: number,
        public readonly totalAmount: number,
        public readonly capacity: number
    ) {
        super(message, agentIndex);
        this.name = 'AgentDeliveryCapacityExceeded';
    }
}

export class AgentMissingCapability extends Violation {
    constructor(
        message: string, 
        agentIndex: number,
        public readonly missingCapabilities: string[]
    ) {
        super(message, agentIndex);
        this.name = 'AgentMissingCapability';
    }
}

export class TimeWindowViolation extends Violation {
    constructor(message: string, agentIndex: number) {
        super(message, agentIndex);
        this.name = 'TimeWindowViolation';
    }
}

export class BreakViolation extends Violation {
    constructor(message: string, agentIndex: number) {
        super(message, agentIndex);
        this.name = 'BreakViolation';
    }
}

export class InvalidParameter extends Error {
    constructor(message: string, public parameterName: string) {
        super(message);
        this.name = 'InvalidParameter';
    }
}

export class AgentNotFound extends Error {
    constructor(message: string, public agentIdOrIndex?: string | number) {
        super(message);
        this.name = 'AgentNotFound';
    }
}

export class JobNotFound extends Error {
    constructor(message: string, public jobIdOrIndex?: string | number) {
        super(message);
        this.name = 'JobNotFound';
    }
}

export class ShipmentNotFound extends Error {
    constructor(message: string, public shipmentIdOrIndex?: string | number) {
        super(message);
        this.name = 'ShipmentNotFound';
    }
}

export class AgentHasNoPlan extends Error {
    constructor(message: string, public agentIndex: number) {
        super(message);
        this.name = 'AgentHasNoPlan';
    }
}

export class ItemsNotUnique extends Error {
    constructor(message: string, public itemType: string) {
        super(message);
        this.name = 'ItemsNotUnique';
    }
}

export class NoItemsProvided extends Error {
    constructor(message: string, public itemType: string) {
        super(message);
        this.name = 'NoItemsProvided';
    }
}

export class ItemAlreadyAssigned extends Error {
    constructor(message: string, public itemType: string, public itemIndex: number, public agentIndex: number) {
        super(message);
        this.name = 'ItemAlreadyAssigned';
    }
}

export class InvalidInsertionPosition extends Error {
    constructor(message: string, public agentIndex: number, public waypointIndex?: number, public actionId?: string) {
        super(message);
        this.name = 'InvalidInsertionPosition';
    }
}

export class UnknownStrategy extends Error {
    constructor(message: string, public strategy: string, public operationType: 'assign' | 'remove') {
        super(message);
        this.name = 'UnknownStrategy';
    }
}

export class RouteMatrixApiError extends Error {
    constructor(message: string, public statusCode?: number, public statusText?: string) {
        super(message);
        this.name = 'RouteMatrixApiError';
    }
}

export class RoutingApiError extends Error {
    constructor(message: string, public statusCode?: number, public statusText?: string) {
        super(message);
        this.name = 'RoutingApiError';
    }
}
