import {
    Agent,
    Avoid,
    Job,
    Location,
    RoutePlanner,
    Shipment,
    ShipmentStep
} from "../../src";

describe("RoutePlanner", () => {
    test("should initialize with default baseUrl and empty input data", () => {
        const planner = new RoutePlanner({ apiKey: "test-key" });
        const raw = planner.getRaw();

        expect((planner as any).baseUrl).toBe("https://api.geoapify.com");
        expect(raw.agents).toEqual([]);
        expect(raw.jobs).toEqual([]);
        expect(raw.shipments).toEqual([]);
        expect(raw.locations).toEqual([]);
        expect(raw.avoid).toEqual([]);
    });

    test("should use provided raw input data", () => {
        const raw = {
            mode: "drive" as const,
            agents: [],
            jobs: [],
            shipments: [],
            locations: [],
            avoid: []
        };
        const planner = new RoutePlanner({ apiKey: "test-key", baseUrl: "https://example.com" }, raw);

        expect(planner.getRaw()).toBe(raw);
    });

    test("should set scalar options and support chaining", () => {
        const planner = new RoutePlanner({ apiKey: "test-key" })
            .setMode("drive")
            .setTraffic("free_flow")
            .setType("balanced")
            .setMaxSpeed(90)
            .setUnits("metric");

        expect(planner.getRaw().mode).toBe("drive");
        expect(planner.getRaw().traffic).toBe("free_flow");
        expect(planner.getRaw().type).toBe("balanced");
        expect(planner.getRaw().max_speed).toBe(90);
        expect(planner.getRaw().units).toBe("metric");
    });

    test("should add agent, job, location, shipment, and avoid entries", () => {
        const planner = new RoutePlanner({ apiKey: "test-key" });

        planner
            .addAgent(new Agent().setId("agent-1").setStartLocation(1, 2))
            .addJob(new Job().setId("job-1").setLocation(1, 2).setDuration(10))
            .addLocation(new Location().setId("loc-1").setLocation(3, 4))
            .addShipment(
                new Shipment()
                    .setId("shipment-1")
                    .setPickup(new ShipmentStep().setLocation(1, 2))
                    .setDelivery(new ShipmentStep().setLocation(3, 4))
            )
            .addAvoid(new Avoid().setType("tolls"));

        expect(planner.getRaw().agents).toHaveLength(1);
        expect(planner.getRaw().jobs).toHaveLength(1);
        expect(planner.getRaw().locations).toHaveLength(1);
        expect(planner.getRaw().shipments).toHaveLength(1);
        expect(planner.getRaw().avoid).toHaveLength(1);
    });

    test("setRaw should replace data and return this", () => {
        const planner = new RoutePlanner({ apiKey: "test-key" });
        const raw = {
            mode: "walk" as const,
            agents: [],
            jobs: [],
            shipments: [],
            locations: [],
            avoid: []
        };

        const result = planner.setRaw(raw);
        expect(result).toBe(planner);
        expect(planner.getRaw()).toBe(raw);
    });
});
