import { RouteViolationValidator } from "../../../../src/tools/route-editor/validations/route-violation-validator";
import {
    AgentDeliveryCapacityExceeded,
    AgentMissingCapability,
    AgentPickupCapacityExceeded,
    BreakViolation,
    Violation
} from "../../../../src/models/entities/route-editor-exceptions";
import { ActionResponseData } from "../../../../src/models/interfaces";

function createAction(overrides: Partial<ActionResponseData>): ActionResponseData {
    return {
        type: "job",
        start_time: 0,
        duration: 0,
        index: 0,
        ...overrides
    };
}

function createContext(rawData: any, actions: ActionResponseData[]) {
    return {
        getRawData: () => rawData,
        getAgentActions: () => actions
    } as any;
}

function getViolations(rawData: any): Violation[] {
    return rawData.properties.violations || [];
}

describe("RouteViolationValidator", () => {
    test("does not report break action as break conflict", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ breaks: [{ time_windows: [[10, 20]] }] }],
                    jobs: [],
                    shipments: []
                }
            }
        };
        const actions = [createAction({ type: "break", start_time: 12, duration: 5 })];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        expect(getViolations(rawData)).toHaveLength(0);
    });

    test("does not report delay action as break conflict", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ breaks: [{ time_windows: [[10, 20]] }] }],
                    jobs: [],
                    shipments: []
                }
            }
        };
        const actions = [createAction({ type: "delay", start_time: 12, duration: 5 })];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        expect(getViolations(rawData)).toHaveLength(0);
    });

    test("reports break conflict for non-break action", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ breaks: [{ time_windows: [[10, 20]] }] }],
                    jobs: [],
                    shipments: [{ amount: 1 }]
                }
            }
        };
        const actions = [createAction({ type: "pickup", start_time: 12, duration: 3, shipment_index: 0 })];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        const breakViolations = getViolations(rawData).filter(v => v instanceof BreakViolation);
        expect(breakViolations).toHaveLength(1);
    });

    test("reports invalid pickup capacity value", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ pickup_capacity: Number.NaN }],
                    jobs: [],
                    shipments: [{ amount: 5 }]
                }
            }
        };
        const actions = [createAction({ type: "pickup", shipment_index: 0 })];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        const pickupViolations = getViolations(rawData).filter(v => v instanceof AgentPickupCapacityExceeded) as AgentPickupCapacityExceeded[];
        expect(pickupViolations).toHaveLength(1);
        expect(pickupViolations[0].message).toContain("invalid");
    });

    test("ignores invalid shipment amount values without dropping valid capacity checks", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ pickup_capacity: 5 }],
                    jobs: [],
                    shipments: [{ amount: Number.NaN }, { amount: 6 }]
                }
            }
        };
        const actions = [
            createAction({ type: "pickup", shipment_index: 0 }),
            createAction({ type: "pickup", shipment_index: 1, index: 1 })
        ];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        const pickupViolations = getViolations(rawData).filter(v => v instanceof AgentPickupCapacityExceeded) as AgentPickupCapacityExceeded[];
        expect(pickupViolations).toHaveLength(1);
        expect(pickupViolations[0].totalAmount).toBe(6);
        expect(pickupViolations[0].capacity).toBe(5);
    });

    test("deduplicates missing capability violations across jobs and shipments", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ capabilities: [] }],
                    jobs: [
                        { requirements: ["cold"] },
                        { requirements: ["cold", "fragile"] }
                    ],
                    shipments: [
                        { requirements: ["cold"] }
                    ]
                }
            }
        };
        const actions = [
            createAction({ type: "job", job_index: 0 }),
            createAction({ type: "job", job_index: 1, index: 1 }),
            createAction({ type: "pickup", shipment_index: 0, index: 2 })
        ];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        const capabilityViolations = getViolations(rawData).filter(v => v instanceof AgentMissingCapability) as AgentMissingCapability[];
        expect(capabilityViolations).toHaveLength(1);
        expect([...capabilityViolations[0].missingCapabilities].sort()).toEqual(["cold", "fragile"]);
    });

    test("reports invalid delivery capacity value", () => {
        const rawData = {
            properties: {
                params: {
                    agents: [{ delivery_capacity: Number.NaN }],
                    jobs: [],
                    shipments: [{ amount: 5 }]
                }
            }
        };
        const actions = [createAction({ type: "delivery", shipment_index: 0 })];

        RouteViolationValidator.validate(createContext(rawData, actions), 0);

        const deliveryViolations = getViolations(rawData).filter(v => v instanceof AgentDeliveryCapacityExceeded);
        expect(deliveryViolations).toHaveLength(1);
    });
});
