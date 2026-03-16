import { RoutePlannerResultEditor, Shipment, ShipmentStep } from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";

function buildEditor(): RoutePlannerResultEditor {
    const raw = loadJson(
        "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-result.json"
    );
    const result = new RoutePlannerResult({ apiKey: "test-key" }, raw);
    return new RoutePlannerResultEditor(result);
}

describe("RoutePlannerResultShipmentEditor", () => {
    test("assignShipments throws when shipment is already assigned to target agent", async () => {
        const editor = buildEditor();
        const result = editor.getModifiedResult();
        const assignedShipmentPlan = result
            .getShipmentPlans()
            .find((shipmentPlan) => shipmentPlan?.getAgentIndex() !== undefined);

        expect(assignedShipmentPlan).toBeDefined();

        const shipmentIndex = assignedShipmentPlan!.getShipmentIndex();
        const agentIndex = assignedShipmentPlan!.getAgentIndex() as number;

        await expect(editor.assignShipments(agentIndex, [shipmentIndex])).rejects.toThrow(
            "already assigned to agent with index"
        );
    });

    test("assignShipments throws when shipment id is not found", async () => {
        const editor = buildEditor();
        await expect(editor.assignShipments(0, ["shipment-does-not-exist"])).rejects.toThrow(
            "Shipment with id shipment-does-not-exist not found"
        );
    });

    test("removeShipments throws when no shipments provided", async () => {
        const editor = buildEditor();
        await expect(editor.removeShipments([])).rejects.toThrow("No shipments provided");
    });

    test("removeShipments throws when shipment list is not unique", async () => {
        const editor = buildEditor();
        await expect(editor.removeShipments([0, 0])).rejects.toThrow("Shipments are not unique");
    });

    test("addNewShipments throws when no shipments provided", async () => {
        const editor = buildEditor();
        await expect(editor.addNewShipments(0, [])).rejects.toThrow("No shipments provided");
    });

    test("addNewShipments throws when shipment list is not unique", async () => {
        const editor = buildEditor();
        const shipment = new Shipment()
            .setPickup(new ShipmentStep().setLocation(13.404954, 52.520008).setDuration(120))
            .setDelivery(new ShipmentStep().setLocation(13.401, 52.53).setDuration(120))
            .setId("duplicate-shipment");

        await expect(editor.addNewShipments(0, [shipment, shipment])).rejects.toThrow(
            "Shipments are not unique"
        );
    });
});
