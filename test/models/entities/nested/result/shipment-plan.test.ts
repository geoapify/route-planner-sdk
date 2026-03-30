import {
    AgentData,
    AgentPlan,
    AgentPlanData,
    RouteAction,
    RoutingOptions,
    ShipmentData
} from "../../../../../src";
import { ShipmentPlan } from "../../../../../src/models/entities/nested/result/shipment-plan";
import { RoutePlannerCallOptions } from "../../../../../src/models/interfaces/route-planner-call-options";

describe("ShipmentPlan", () => {
    const agentInputData: AgentData = {
        start_location: [10, 20],
        capabilities: [],
        breaks: [],
        time_windows: []
    };

    const routingOptions: RoutingOptions = {
        mode: "drive"
    };

    const callOptions: RoutePlannerCallOptions = {
        apiKey: "test-key",
        baseUrl: "https://api.geoapify.com"
    };

    const agentPlanData: AgentPlanData = {
        agent_index: 1,
        agent_id: "agent-1",
        time: 100,
        start_time: 0,
        end_time: 100,
        distance: 1000,
        mode: "drive",
        legs: [],
        actions: [
            { type: "pickup", start_time: 10, duration: 5, shipment_index: 4, shipment_id: "shipment-4", index: 0, waypoint_index: 0 },
            { type: "delivery", start_time: 20, duration: 5, shipment_index: 4, shipment_id: "shipment-4", index: 1, waypoint_index: 1 },
            { type: "pickup", start_time: 30, duration: 5, shipment_index: 8, shipment_id: "shipment-8", index: 2, waypoint_index: 2 }
        ],
        waypoints: [
            { original_location: [10, 20], location: [10, 20], start_time: 0, duration: 0, actions: [] }
        ]
    };

    const shipmentInputData: ShipmentData = {
        id: "shipment-4",
        requirements: [],
        pickup: {
            location: [1, 1],
            time_windows: []
        },
        delivery: {
            location: [2, 2],
            time_windows: []
        }
    };

    test("should throw if shipment input is missing", () => {
        expect(() => new ShipmentPlan(4, undefined as any, undefined)).toThrow("shipmentInputData is undefined");
    });

    test("should return undefined agent fields and empty actions when unassigned", () => {
        const plan = new ShipmentPlan(4, shipmentInputData, undefined);
        expect(plan.getAgentId()).toBeUndefined();
        expect(plan.getAgentIndex()).toBeUndefined();
        expect(plan.getRouteActions()).toEqual([]);
        expect(plan.getAgentPlan()).toBeUndefined();
        expect(plan.getShipmentInputData()).toEqual(shipmentInputData);
        expect(plan.getShipmentId()).toBe("shipment-4");
        expect(plan.getShipmentIndex()).toBe(4);
    });

    test("should return assigned agent fields and only shipment actions for this shipment index", () => {
        const agentPlan = new AgentPlan(agentPlanData, agentInputData, routingOptions, callOptions, []);
        const plan = new ShipmentPlan(4, shipmentInputData, agentPlan);
        const routeActions = plan.getRouteActions();

        expect(plan.getAgentId()).toBe("agent-1");
        expect(plan.getAgentIndex()).toBe(1);
        expect(plan.getAgentPlan()).toBe(agentPlan);
        expect(plan.getShipmentInputData()).toEqual(shipmentInputData);
        expect(plan.getShipmentId()).toBe("shipment-4");
        expect(plan.getShipmentIndex()).toBe(4);

        expect(routeActions).toHaveLength(2);
        expect(routeActions[0]).toBeInstanceOf(RouteAction);
        expect(routeActions[1]).toBeInstanceOf(RouteAction);
        expect(routeActions.every((action: RouteAction) => action.getShipmentIndex() === 4)).toBe(true);
    });
});
