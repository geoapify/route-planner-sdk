import {
    AgentDeliveryCapacityExceeded,
    AgentHasNoPlan,
    AgentMissingCapability,
    AgentNotFound,
    AgentPickupCapacityExceeded,
    BreakViolation,
    InvalidInsertionPosition,
    InvalidParameter,
    ItemAlreadyAssigned,
    ItemsNotUnique,
    JobNotFound,
    NoItemsProvided,
    RouteMatrixApiError,
    RoutingApiError,
    ShipmentNotFound,
    TimeWindowViolation,
    UnknownStrategy,
    Violation
} from "../../../src";

describe("route-editor-exceptions", () => {
    test("Violation should keep message, agent index, and toString", () => {
        const violation = new Violation("Violation message", 3);
        expect(violation.name).toBe("Violation");
        expect(violation.message).toBe("Violation message");
        expect(violation.agentIndex).toBe(3);
        expect(violation.toString()).toBe("Violation message");
    });

    test("violation subclasses should set names and extra fields", () => {
        const pickup = new AgentPickupCapacityExceeded("pickup", 1, 120, 100);
        expect(pickup.name).toBe("AgentPickupCapacityExceeded");
        expect(pickup.totalAmount).toBe(120);
        expect(pickup.capacity).toBe(100);

        const delivery = new AgentDeliveryCapacityExceeded("delivery", 2, 220, 200);
        expect(delivery.name).toBe("AgentDeliveryCapacityExceeded");
        expect(delivery.totalAmount).toBe(220);
        expect(delivery.capacity).toBe(200);

        const missingCapability = new AgentMissingCapability("cap", 4, ["cold-chain"]);
        expect(missingCapability.name).toBe("AgentMissingCapability");
        expect(missingCapability.missingCapabilities).toEqual(["cold-chain"]);

        const twViolation = new TimeWindowViolation("tw", 5);
        expect(twViolation.name).toBe("TimeWindowViolation");
        expect(twViolation.agentIndex).toBe(5);

        const breakViolation = new BreakViolation("break", 6);
        expect(breakViolation.name).toBe("BreakViolation");
        expect(breakViolation.agentIndex).toBe(6);
    });

    test("other editor errors should preserve constructor fields", () => {
        const invalidParam = new InvalidParameter("bad type", "agentIndex");
        expect(invalidParam.name).toBe("InvalidParameter");
        expect(invalidParam.parameterName).toBe("agentIndex");

        const agentNotFound = new AgentNotFound("missing agent", "agent-1");
        expect(agentNotFound.name).toBe("AgentNotFound");
        expect(agentNotFound.agentIdOrIndex).toBe("agent-1");

        const jobNotFound = new JobNotFound("missing job", 9);
        expect(jobNotFound.name).toBe("JobNotFound");
        expect(jobNotFound.jobIdOrIndex).toBe(9);

        const shipmentNotFound = new ShipmentNotFound("missing shipment", "shipment-1");
        expect(shipmentNotFound.name).toBe("ShipmentNotFound");
        expect(shipmentNotFound.shipmentIdOrIndex).toBe("shipment-1");

        const noPlan = new AgentHasNoPlan("no plan", 2);
        expect(noPlan.name).toBe("AgentHasNoPlan");
        expect(noPlan.agentIndex).toBe(2);

        const notUnique = new ItemsNotUnique("not unique", "job");
        expect(notUnique.name).toBe("ItemsNotUnique");
        expect(notUnique.itemType).toBe("job");

        const noItems = new NoItemsProvided("none", "shipment");
        expect(noItems.name).toBe("NoItemsProvided");
        expect(noItems.itemType).toBe("shipment");

        const alreadyAssigned = new ItemAlreadyAssigned("assigned", "job", 11, 1);
        expect(alreadyAssigned.name).toBe("ItemAlreadyAssigned");
        expect(alreadyAssigned.itemType).toBe("job");
        expect(alreadyAssigned.itemIndex).toBe(11);
        expect(alreadyAssigned.agentIndex).toBe(1);

        const invalidInsert = new InvalidInsertionPosition("invalid", 1, 7, "action-1");
        expect(invalidInsert.name).toBe("InvalidInsertionPosition");
        expect(invalidInsert.agentIndex).toBe(1);
        expect(invalidInsert.waypointIndex).toBe(7);
        expect(invalidInsert.actionId).toBe("action-1");

        const unknown = new UnknownStrategy("unknown", "preserve-order", "assign");
        expect(unknown.name).toBe("UnknownStrategy");
        expect(unknown.strategy).toBe("preserve-order");
        expect(unknown.operationType).toBe("assign");

        const matrixApiError = new RouteMatrixApiError("matrix", 500, "Internal Server Error");
        expect(matrixApiError.name).toBe("RouteMatrixApiError");
        expect(matrixApiError.statusCode).toBe(500);
        expect(matrixApiError.statusText).toBe("Internal Server Error");

        const routingApiError = new RoutingApiError("routing", 429, "Too Many Requests");
        expect(routingApiError.name).toBe("RoutingApiError");
        expect(routingApiError.statusCode).toBe(429);
        expect(routingApiError.statusText).toBe("Too Many Requests");
    });
});
