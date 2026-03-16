import { PRESERVE_ORDER, REOPTIMIZE, RoutePlannerResultEditor } from "../../../src";
import { buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.removeShipments (live)", () => {
    liveTest("removeShipments + preserveOrder + single", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedShipment = result.getShipmentPlans().find((shipmentPlan) => shipmentPlan.getAgentIndex() !== undefined);
        expect(assignedShipment).toBeDefined();

        const sourceAgentIndex = assignedShipment!.getAgentIndex() as number;
        const sourcePlanBefore = result.getAgentPlan(sourceAgentIndex);
        expect(sourcePlanBefore).toBeDefined();
        const sourceCountBefore = sourcePlanBefore!.getPlannedShipments().length;

        await editor.removeShipments([assignedShipment!.getShipmentIndex()], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        expect(modified.getShipmentPlan(assignedShipment!.getShipmentIndex())?.getAgentIndex()).toBeUndefined();

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedShipments().length).toBe(sourceCountBefore - 1);
            expect(sourcePlanAfter.containsShipment(assignedShipment!.getShipmentIndex())).toBe(false);
        }
    });

    liveTest("removeShipments + preserveOrder + multiple", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const sourcePlan = result
            .getAgentPlans()
            .find((agentPlan) => !!agentPlan && agentPlan.getPlannedShipments().length >= 2);
        expect(sourcePlan).toBeDefined();

        const sourceAgentIndex = sourcePlan!.getAgentIndex();
        const shipmentsToRemove = sourcePlan!.getPlannedShipments().slice(0, 2);
        const sourceCountBefore = sourcePlan!.getPlannedShipments().length;

        await editor.removeShipments(shipmentsToRemove, { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        for (const shipmentIndex of shipmentsToRemove) {
            expect(modified.getShipmentPlan(shipmentIndex)?.getAgentIndex()).toBeUndefined();
        }

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedShipments().length).toBe(sourceCountBefore - shipmentsToRemove.length);
            for (const shipmentIndex of shipmentsToRemove) {
                expect(sourcePlanAfter.containsShipment(shipmentIndex)).toBe(false);
            }
        }
    });

    liveTest("removeShipments + reoptimize + single", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedShipment = result.getShipmentPlans().find((shipmentPlan) => shipmentPlan.getAgentIndex() !== undefined);
        expect(assignedShipment).toBeDefined();

        const sourceAgentIndex = assignedShipment!.getAgentIndex() as number;
        const sourcePlanBefore = result.getAgentPlan(sourceAgentIndex);
        expect(sourcePlanBefore).toBeDefined();
        const sourceCountBefore = sourcePlanBefore!.getPlannedShipments().length;

        await editor.removeShipments([assignedShipment!.getShipmentIndex()], { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        expect(modified.getShipmentPlan(assignedShipment!.getShipmentIndex())?.getAgentIndex()).toBeUndefined();

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedShipments().length).toBe(sourceCountBefore - 1);
            expect(sourcePlanAfter.containsShipment(assignedShipment!.getShipmentIndex())).toBe(false);
        }
    });

    liveTest("removeShipments + reoptimize + multiple", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const sourcePlan = result
            .getAgentPlans()
            .find((agentPlan) => !!agentPlan && agentPlan.getPlannedShipments().length >= 2);
        expect(sourcePlan).toBeDefined();

        const sourceAgentIndex = sourcePlan!.getAgentIndex();
        const shipmentsToRemove = sourcePlan!.getPlannedShipments().slice(0, 2);
        const sourceCountBefore = sourcePlan!.getPlannedShipments().length;

        await editor.removeShipments(shipmentsToRemove, { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        for (const shipmentIndex of shipmentsToRemove) {
            expect(modified.getShipmentPlan(shipmentIndex)?.getAgentIndex()).toBeUndefined();
        }

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedShipments().length).toBe(sourceCountBefore - shipmentsToRemove.length);
            for (const shipmentIndex of shipmentsToRemove) {
                expect(sourcePlanAfter.containsShipment(shipmentIndex)).toBe(false);
            }
        }
    });
});
