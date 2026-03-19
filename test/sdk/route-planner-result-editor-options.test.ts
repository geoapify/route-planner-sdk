import {
    AgentHasNoPlan,
    AgentNotFound,
    InvalidParameter,
    InvalidInsertionPosition,
    ItemAlreadyAssigned,
    ItemsNotUnique,
    Job,
    JobNotFound,
    NoItemsProvided,
    RoutePlannerResultEditor,
    RoutePlannerResultResponseData,
    Shipment,
    ShipmentNotFound,
    ShipmentStep,
    UnknownStrategy
} from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { loadJson } from "../utils.helper";

const JOBS_RESULT_FILE =
    "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-result.json";
const SHIPMENTS_RESULT_FILE =
    "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-result.json";

function createResult(file: string): RoutePlannerResult {
    const raw = loadJson(file) as RoutePlannerResultResponseData;
    return new RoutePlannerResult(
        { apiKey: "test-key", baseUrl: "https://api.geoapify.com" },
        raw
    );
}

function createJobsEditor(): RoutePlannerResultEditor {
    return new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
}

function createShipmentsEditor(): RoutePlannerResultEditor {
    return new RoutePlannerResultEditor(createResult(SHIPMENTS_RESULT_FILE));
}

describe("RoutePlannerResultEditor options and non-API behavior", () => {
    test("assignJobs should normalize missing options to {}", async () => {
        const editor = createJobsEditor();
        const assignJobs = jest.fn().mockResolvedValue(true);
        (editor as any).jobEditor = {
            assignJobs,
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };

        await editor.assignJobs(0, [0]);

        expect(assignJobs).toHaveBeenCalledWith(0, [0], {});
    });

    test("assignJobs should pass explicit options", async () => {
        const editor = createJobsEditor();
        const assignJobs = jest.fn().mockResolvedValue(true);
        (editor as any).jobEditor = {
            assignJobs,
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };

        await editor.assignJobs(0, [0], { strategy: "preserveOrder", append: true });

        expect(assignJobs).toHaveBeenCalledWith(0, [0], { strategy: "preserveOrder", append: true });
    });

    test("removeJobs should normalize missing options to {}", async () => {
        const editor = createJobsEditor();
        const removeJobs = jest.fn().mockResolvedValue(true);
        (editor as any).jobEditor = {
            assignJobs: jest.fn(),
            removeJobs,
            addNewJobs: jest.fn()
        };

        await editor.removeJobs([0]);

        expect(removeJobs).toHaveBeenCalledWith([0], {});
    });

    test("addNewJobs should normalize missing options to {}", async () => {
        const editor = createJobsEditor();
        const addNewJobs = jest.fn().mockResolvedValue(true);
        (editor as any).jobEditor = {
            assignJobs: jest.fn(),
            removeJobs: jest.fn(),
            addNewJobs
        };

        const newJob = new Job().setId("job-new").setLocation(1, 1).setDuration(60);
        await editor.addNewJobs(0, [newJob]);

        expect(addNewJobs).toHaveBeenCalledWith(0, [newJob], {});
    });

    test("assignShipments should normalize missing options to {}", async () => {
        const editor = createShipmentsEditor();
        const assignShipments = jest.fn().mockResolvedValue(true);
        (editor as any).shipmentEditor = {
            assignShipments,
            removeShipments: jest.fn(),
            addNewShipments: jest.fn()
        };

        await editor.assignShipments(0, [0]);

        expect(assignShipments).toHaveBeenCalledWith(0, [0], {});
    });

    test("assignShipments should pass explicit options", async () => {
        const editor = createShipmentsEditor();
        const assignShipments = jest.fn().mockResolvedValue(true);
        (editor as any).shipmentEditor = {
            assignShipments,
            removeShipments: jest.fn(),
            addNewShipments: jest.fn()
        };

        await editor.assignShipments(0, [0], { strategy: "preserveOrder", append: true });

        expect(assignShipments).toHaveBeenCalledWith(0, [0], { strategy: "preserveOrder", append: true });
    });

    test("removeShipments should normalize missing options to {}", async () => {
        const editor = createShipmentsEditor();
        const removeShipments = jest.fn().mockResolvedValue(true);
        (editor as any).shipmentEditor = {
            assignShipments: jest.fn(),
            removeShipments,
            addNewShipments: jest.fn()
        };

        await editor.removeShipments([0]);

        expect(removeShipments).toHaveBeenCalledWith([0], {});
    });

    test("addNewShipments should normalize missing options to {}", async () => {
        const editor = createShipmentsEditor();
        const addNewShipments = jest.fn().mockResolvedValue(true);
        (editor as any).shipmentEditor = {
            assignShipments: jest.fn(),
            removeShipments: jest.fn(),
            addNewShipments
        };

        const newShipment = new Shipment()
            .setId("shipment-new")
            .setPickup(new ShipmentStep().setLocation(1, 1).setDuration(10))
            .setDelivery(new ShipmentStep().setLocation(2, 2).setDuration(10));

        await editor.addNewShipments(0, [newShipment]);

        expect(addNewShipments).toHaveBeenCalledWith(0, [newShipment], {});
    });

    test("assignJobs should validate array parameter", async () => {
        const editor = createJobsEditor();

        await expect(editor.assignJobs(0, "invalid" as any)).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.assignJobs(0, "invalid" as any)).rejects.toThrow("jobIndexesOrIds must be an array");
    });

    test("assignShipments should validate array parameter", async () => {
        const editor = createShipmentsEditor();

        await expect(editor.assignShipments(0, "invalid" as any)).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.assignShipments(0, "invalid" as any)).rejects.toThrow("shipmentIndexesOrIds must be an array");
    });

    test("removeJobs should validate array parameter", async () => {
        const editor = createJobsEditor();

        await expect(editor.removeJobs("invalid" as any)).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.removeJobs("invalid" as any)).rejects.toThrow("jobIndexesOrIds must be an array");
    });

    test("removeShipments should validate array parameter", async () => {
        const editor = createShipmentsEditor();

        await expect(editor.removeShipments("invalid" as any)).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.removeShipments("invalid" as any)).rejects.toThrow("shipmentIndexes must be an array");
    });

    test("addNewJobs should validate array parameter", async () => {
        const editor = createJobsEditor();

        expect(() => editor.addNewJobs(0, "invalid" as any)).toThrow(InvalidParameter);
        expect(() => editor.addNewJobs(0, "invalid" as any)).toThrow("jobs must be an array");
    });

    test("addNewShipments should validate array parameter", async () => {
        const editor = createShipmentsEditor();

        expect(() => editor.addNewShipments(0, "invalid" as any)).toThrow(InvalidParameter);
        expect(() => editor.addNewShipments(0, "invalid" as any)).toThrow("shipments must be an array");
    });

    test("addNewJobs should validate new job location", async () => {
        const editor = createJobsEditor();
        const invalidJob = new Job().setId("job-no-location").setDuration(30);

        await expect(editor.addNewJobs(0, [invalidJob])).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.addNewJobs(0, [invalidJob])).rejects.toThrow("must have either location or location_index");
    });

    test("addNewShipments should validate pickup and delivery locations", async () => {
        const editor = createShipmentsEditor();
        const invalidShipment = new Shipment()
            .setId("shipment-no-delivery-location")
            .setPickup(new ShipmentStep().setLocation(1, 1).setDuration(10))
            .setDelivery(new ShipmentStep().setDuration(10));

        await expect(editor.addNewShipments(0, [invalidShipment])).rejects.toBeInstanceOf(InvalidParameter);
        await expect(editor.addNewShipments(0, [invalidShipment])).rejects.toThrow("without location or location_index");
    });
});

describe("RoutePlannerResultEditor errors from incorrect params", () => {
    test("should throw AgentNotFound for unknown agent", async () => {
        const editor = createJobsEditor();
        await expect(editor.assignJobs("__missing_agent__", [0])).rejects.toBeInstanceOf(AgentNotFound);
    });

    test("should throw JobNotFound for unknown job", async () => {
        const editor = createJobsEditor();
        await expect(editor.assignJobs(0, ["__missing_job__"])).rejects.toBeInstanceOf(JobNotFound);
    });

    test("should throw ShipmentNotFound for unknown shipment", async () => {
        const editor = createShipmentsEditor();
        await expect(editor.assignShipments(0, ["__missing_shipment__"])).rejects.toBeInstanceOf(ShipmentNotFound);
    });

    test("should throw NoItemsProvided when no indexes are provided", async () => {
        const editor = createJobsEditor();
        await expect(editor.removeJobs([])).rejects.toBeInstanceOf(NoItemsProvided);
    });

    test("should throw ItemsNotUnique when duplicate indexes are provided", async () => {
        const editor = createJobsEditor();
        await expect(editor.removeJobs([0, 0])).rejects.toBeInstanceOf(ItemsNotUnique);
    });

    test("should throw ItemAlreadyAssigned when assigning an already assigned job to same agent", async () => {
        const result = createResult(JOBS_RESULT_FILE);
        const assignedPlan = result.getAgentPlans().find((plan) => !!plan && plan.getPlannedJobs().length > 0)!;
        const agentIndex = assignedPlan!.getAgentIndex();
        const jobIndex = assignedPlan!.getPlannedJobs()[0];
        const editor = new RoutePlannerResultEditor(result);

        await expect(editor.assignJobs(agentIndex, [jobIndex])).rejects.toBeInstanceOf(ItemAlreadyAssigned);
    });

    test("should throw UnknownStrategy for invalid assign strategy", async () => {
        const editor = createJobsEditor();
        const newJob = new Job().setId("job-invalid-strategy").setLocation(1, 1).setDuration(30);
        await expect(editor.addNewJobs(0, [newJob], { strategy: "invalid-strategy" as any })).rejects.toBeInstanceOf(UnknownStrategy);
    });

    test("should throw UnknownStrategy for invalid remove strategy", async () => {
        const editor = createJobsEditor();
        await expect(editor.removeJobs([0], { strategy: "invalid-strategy" as any })).rejects.toBeInstanceOf(UnknownStrategy);
    });

    test("should throw AgentHasNoPlan when moving waypoint for agent without feature", async () => {
        const result = createResult(JOBS_RESULT_FILE);
        const raw = result.getRaw() as RoutePlannerResultResponseData;
        const agentIndex = raw.features[0].properties.agent_index;
        raw.features = raw.features.filter((feature) => feature.properties.agent_index !== agentIndex);
        const editor = new RoutePlannerResultEditor(result);

        await expect(editor.moveWaypoint(agentIndex, 1, 2)).rejects.toBeInstanceOf(AgentHasNoPlan);
    });

    test("should throw InvalidInsertionPosition for invalid waypoint index", async () => {
        const editor = createJobsEditor();
        const agentIndex = editor.getModifiedResult().getRaw().features[0].properties.agent_index;

        await expect(editor.moveWaypoint(agentIndex, -1, 0)).rejects.toBeInstanceOf(InvalidInsertionPosition);
    });

    test("should throw InvalidInsertionPosition when moving shipment pickup after delivery", async () => {
        const editor = createShipmentsEditor();
        const raw = editor.getModifiedResult().getRaw();

        let targetAgentIndex = -1;
        let pickupWaypointIndex = -1;
        let deliveryWaypointIndex = -1;

        for (const feature of raw.features) {
            const waypoints = feature.properties.waypoints;

            for (let currentPickupIndex = 0; currentPickupIndex < waypoints.length; currentPickupIndex++) {
                const pickupWaypoint = waypoints[currentPickupIndex];
                const hasBoundaryAction = pickupWaypoint.actions.some(
                    (action) => action.type === "start" || action.type === "end"
                );
                if (hasBoundaryAction) {
                    continue;
                }

                const pickupAction = pickupWaypoint.actions.find(
                    (action) => action.type === "pickup" && typeof action.shipment_index === "number"
                );
                if (!pickupAction || pickupAction.shipment_index === undefined) {
                    continue;
                }

                const currentDeliveryIndex = waypoints.findIndex((waypoint) =>
                    waypoint.actions.some(
                        (action) =>
                            action.type === "delivery" &&
                            action.shipment_index === pickupAction.shipment_index
                    )
                );

                if (currentDeliveryIndex !== -1 && currentPickupIndex < currentDeliveryIndex) {
                    targetAgentIndex = feature.properties.agent_index;
                    pickupWaypointIndex = currentPickupIndex;
                    deliveryWaypointIndex = currentDeliveryIndex;
                    break;
                }
            }

            if (targetAgentIndex !== -1) {
                break;
            }
        }

        expect(targetAgentIndex).toBeGreaterThanOrEqual(0);
        await expect(
            editor.moveWaypoint(targetAgentIndex, pickupWaypointIndex, deliveryWaypointIndex)
        ).rejects.toBeInstanceOf(InvalidInsertionPosition);
    });
});
