import { Agent, AgentData, Break } from "../../../../../src";

describe("Agent", () => {
    let agent: Agent;
    let initialData: AgentData;

    beforeEach(() => {
        initialData = {
            id: "A1",
            description: "Test Agent",
            capabilities: ["drive"],
            time_windows: [[1609459200, 1609462800]],
            breaks: [],
            start_location: [40.712776, -74.005974],
            end_location: [34.052235, -118.243683],
            pickup_capacity: 100,
            delivery_capacity: 50,
            start_location_index: 1,
            end_location_index: 2,
        };

        agent = new Agent(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultAgent = new Agent();
        expect(defaultAgent.getRaw()).toEqual({
            capabilities: [],
            time_windows: [],
            breaks: [],
        });
    });

    test("should return the raw data", () => {
        expect(agent.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: AgentData = { ...initialData, id: "A2", description: "Updated Agent" };
        agent.setRaw(newData);
        expect(agent.getRaw()).toEqual(newData);
    });

    test("should set start location", () => {
        agent.setStartLocation(10.0, 20.0);
        expect(agent.getRaw().start_location).toEqual([10.0, 20.0]);
    });

    test("should set start location index", () => {
        agent.setStartLocationIndex(5);
        expect(agent.getRaw().start_location_index).toBe(5);
    });

    test("should set end location", () => {
        agent.setEndLocation(30.0, 40.0);
        expect(agent.getRaw().end_location).toEqual([30.0, 40.0]);
    });

    test("should set end location index", () => {
        agent.setEndLocationIndex(10);
        expect(agent.getRaw().end_location_index).toBe(10);
    });

    test("should set pickup capacity", () => {
        agent.setPickupCapacity(200);
        expect(agent.getRaw().pickup_capacity).toBe(200);
    });

    test("should set delivery capacity", () => {
        agent.setDeliveryCapacity(150);
        expect(agent.getRaw().delivery_capacity).toBe(150);
    });

    test("should add capability", () => {
        agent.addCapability("fly");
        expect(agent.getRaw().capabilities).toContain("fly");
    });

    test("should add time window", () => {
        agent.addTimeWindow(1609462800, 1609466400);
        expect(agent.getRaw().time_windows).toContainEqual([1609462800, 1609466400]);
    });

    test("should add a break", () => {
        const breakInstance = new Break({
            duration: 100,
            time_windows: [[0,1]]
        });
        agent.addBreak(breakInstance);
        expect(agent.getRaw().breaks).toContainEqual(breakInstance.getRaw());
    });

    test("should set ID", () => {
        agent.setId("A2");
        expect(agent.getRaw().id).toBe("A2");
    });

    test("should set description", () => {
        agent.setDescription("Updated Description");
        expect(agent.getRaw().description).toBe("Updated Description");
    });
});
