import { RoutePlannerResultEditor, Shipment, ShipmentStep } from "../../../src";
import { buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.addNewShipments (live)", () => {
    liveTest("should add and assign a new shipment", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const newShipmentId = "shipment-live-new";
        const newShipment = new Shipment()
            .setId(newShipmentId)
            .setPickup(new ShipmentStep().setLocation(13.404, 52.519).setDuration(60))
            .setDelivery(new ShipmentStep().setLocation(13.427, 52.524).setDuration(60));

        await editor.addNewShipments(0, [newShipment]);

        const modified = editor.getModifiedResult();
        expect(modified.getShipmentPlan(newShipmentId)).toBeDefined();
        expect(modified.getShipmentPlan(newShipmentId)?.getAgentIndex()).toBe(0);
    });

    test.todo("addNewShipments + simple + single");
    test.todo("addNewShipments + simple + multiple");
});
