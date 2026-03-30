import {
    Job,
    RoutePlannerResultEditor,
    RoutePlannerResultResponseData,
    Shipment,
    ShipmentStep
} from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { AgentReoptimizeHelper, AgentTimeOffsetHelper, WaypointMoveHelper } from "../../src/tools/route-editor/helpers";
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

describe("RoutePlannerResultEditor", () => {
    test("getModifiedResult should return cloned result data", () => {
        const original = createResult(JOBS_RESULT_FILE);
        const editor = new RoutePlannerResultEditor(original);

        const modified = editor.getModifiedResult();
        modified.getRaw().properties.params.agents[0].id = "changed-agent";

        expect(original.getRaw().properties.params.agents[0].id).not.toBe("changed-agent");
    });

    test("getModifiedResult should return an isolated snapshot", () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));

        const snapshot1 = editor.getModifiedResult();
        snapshot1.getRaw().properties.params.agents[0].id = "snapshot-only-agent";

        const snapshot2 = editor.getModifiedResult();
        expect(snapshot2.getRaw().properties.params.agents[0].id).not.toBe("snapshot-only-agent");
    });

    test("assignJobs should delegate to RouteResultJobEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const assignJobs = jest.fn().mockResolvedValue(true);

        (editor as any).jobEditor = {
            assignJobs,
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };

        await expect(editor.assignJobs(0, [0])).resolves.toBe(true);
        expect(assignJobs).toHaveBeenCalledWith(0, [0], {});
    });

    test("removeJobs should delegate to RouteResultJobEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const removeJobs = jest.fn().mockResolvedValue(true);

        (editor as any).jobEditor = {
            assignJobs: jest.fn(),
            removeJobs,
            addNewJobs: jest.fn()
        };

        await expect(editor.removeJobs([0])).resolves.toBe(true);
        expect(removeJobs).toHaveBeenCalledWith([0], {});
    });

    test("addNewJobs should delegate to RouteResultJobEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const addNewJobs = jest.fn().mockResolvedValue(true);

        (editor as any).jobEditor = {
            assignJobs: jest.fn(),
            removeJobs: jest.fn(),
            addNewJobs
        };

        const newJob = new Job().setId("new-job").setLocation(1, 1).setDuration(60);
        await expect(editor.addNewJobs(0, [newJob])).resolves.toBe(true);
        expect(addNewJobs).toHaveBeenCalledWith(0, [newJob], {});
    });

    test("assignShipments should delegate to RouteResultShipmentEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(SHIPMENTS_RESULT_FILE));
        const assignShipments = jest.fn().mockResolvedValue(true);

        (editor as any).shipmentEditor = {
            assignShipments,
            removeShipments: jest.fn(),
            addNewShipments: jest.fn()
        };

        await expect(editor.assignShipments(0, [0])).resolves.toBe(true);
        expect(assignShipments).toHaveBeenCalledWith(0, [0], {});
    });

    test("removeShipments should delegate to RouteResultShipmentEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(SHIPMENTS_RESULT_FILE));
        const removeShipments = jest.fn().mockResolvedValue(true);

        (editor as any).shipmentEditor = {
            assignShipments: jest.fn(),
            removeShipments,
            addNewShipments: jest.fn()
        };

        await expect(editor.removeShipments([0])).resolves.toBe(true);
        expect(removeShipments).toHaveBeenCalledWith([0], {});
    });

    test("addNewShipments should delegate to RouteResultShipmentEditor", async () => {
        const editor = new RoutePlannerResultEditor(createResult(SHIPMENTS_RESULT_FILE));
        const addNewShipments = jest.fn().mockResolvedValue(true);

        (editor as any).shipmentEditor = {
            assignShipments: jest.fn(),
            removeShipments: jest.fn(),
            addNewShipments
        };

        const newShipment = new Shipment()
            .setId("new-shipment")
            .setPickup(new ShipmentStep().setLocation(1, 1).setDuration(10))
            .setDelivery(new ShipmentStep().setLocation(2, 2).setDuration(10));

        await expect(editor.addNewShipments(0, [newShipment])).resolves.toBe(true);
        expect(addNewShipments).toHaveBeenCalledWith(0, [newShipment], {});
    });

    test("reoptimizeAgentPlan should delegate to AgentReoptimizeHelper", async () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const fakeJobEditor = {
            assignJobs: jest.fn(),
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };
        (editor as any).jobEditor = fakeJobEditor;

        const spy = jest.spyOn(AgentReoptimizeHelper, "execute").mockResolvedValue(true);

        await expect(editor.reoptimizeAgentPlan(0)).resolves.toBe(true);
        expect(spy).toHaveBeenCalledWith(fakeJobEditor, 0, {});
    });

    test("addDelayAfterWaypoint should delegate to AgentTimeOffsetHelper", () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const fakeJobEditor = {
            assignJobs: jest.fn(),
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };
        (editor as any).jobEditor = fakeJobEditor;

        const spy = jest.spyOn(AgentTimeOffsetHelper, "execute").mockImplementation(() => {});

        editor.addDelayAfterWaypoint(0, 1, 60);
        expect(spy).toHaveBeenCalledWith(fakeJobEditor, 0, 1, 60);
    });

    test("addTimeOffsetAfterWaypoint should delegate to addDelayAfterWaypoint", () => {
        const editor = new RoutePlannerResultEditor(createResult(JOBS_RESULT_FILE));
        const spy = jest.spyOn(editor, "addDelayAfterWaypoint").mockImplementation(() => {});

        editor.addTimeOffsetAfterWaypoint(0, 1, 60);
        expect(spy).toHaveBeenCalledWith(0, 1, 60);
    });

    test("moveWaypoint should delegate to WaypointMoveHelper", async () => {
        const editor = new RoutePlannerResultEditor(createResult(SHIPMENTS_RESULT_FILE));
        const fakeJobEditor = {
            assignJobs: jest.fn(),
            removeJobs: jest.fn(),
            addNewJobs: jest.fn()
        };
        (editor as any).jobEditor = fakeJobEditor;

        const spy = jest.spyOn(WaypointMoveHelper, "execute").mockResolvedValue(undefined);

        await editor.moveWaypoint(0, 1, 2);
        expect(spy).toHaveBeenCalledWith(fakeJobEditor, 0, 1, 2);
    });
});
