import { RoutePlannerResultEditor } from "../../../src";
import { buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.removeShipments (live)", () => {
    liveTest("should remove a shipment from assignment", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedShipment = result.getShipmentPlans().find(shipmentPlan => shipmentPlan?.getAgentIndex() !== undefined);
        expect(assignedShipment).toBeDefined();

        await editor.removeShipments([assignedShipment!.getShipmentIndex()]);

        const modified = editor.getModifiedResult();
        expect(modified.getShipmentPlan(assignedShipment!.getShipmentIndex())?.getAgentIndex()).toBeUndefined();
    });
});
