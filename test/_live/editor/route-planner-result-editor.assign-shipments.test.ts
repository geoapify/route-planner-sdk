import RoutePlanner, { PRESERVE_ORDER, REOPTIMIZE, RoutePlannerInputData, RoutePlannerResultEditor } from "../../../src";
import { buildShipmentsResult, hasLiveApiKey, LIVE_TEST_API_KEY } from "./editor-live.helper";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

function getShipmentsAssignmentSignature(result: any): Array<{ shipmentIndex: number; agentIndex: number | undefined; pickupWaypointIndex: number | undefined; deliveryWaypointIndex: number | undefined; }> {
    return result.getShipmentPlans().map((shipmentPlan: any) => {
        const actions = shipmentPlan.getRouteActions();
        return {
            shipmentIndex: shipmentPlan.getShipmentIndex(),
            agentIndex: shipmentPlan.getAgentIndex(),
            pickupWaypointIndex: actions.find((action: any) => action.getType() === "pickup")?.getWaypointIndex(),
            deliveryWaypointIndex: actions.find((action: any) => action.getType() === "delivery")?.getWaypointIndex()
        };
    });
}

describe("RoutePlannerResultEditor.assignShipments (live)", () => {
    liveTest("should assign a shipment to target agent", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedShipment = result.getShipmentPlans().find(shipmentPlan => shipmentPlan?.getAgentIndex() !== undefined);
        expect(assignedShipment).toBeDefined();

        const sourceAgentIndex = assignedShipment!.getAgentIndex() as number;
        const targetAgentIndex = sourceAgentIndex === 0 ? 1 : 0;

        await editor.assignShipments(targetAgentIndex, [assignedShipment!.getShipmentIndex()]);

        const modified = editor.getModifiedResult();
        expect(modified.getShipmentPlan(assignedShipment!.getShipmentIndex())?.getAgentIndex()).toBe(targetAgentIndex);
    });

    liveTest("preserveOrder + without position + no deletion", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const shipmentId = "order_10";

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const beforeWaypointCount = targetPlanBefore!.getWaypoints().length;

        await editor.assignShipments(targetAgentIndex, [shipmentId], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();

        const shipmentPlan = modified.getShipmentPlan(shipmentId);
        expect(shipmentPlan).toBeDefined();
        expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

        const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(pickupAction).toBeDefined();
        expect(deliveryAction).toBeDefined();
        expect(pickupAction!.getWaypointIndex()).toBe(1);
        expect(deliveryAction!.getWaypointIndex()).toBe(2);

        const waypointsAfter = targetPlanAfter!.getWaypoints();
        expect(waypointsAfter.length).toBe(beforeWaypointCount + 1);

        const pickupActionsAtWaypoint1 = waypointsAfter[1]
            .getActions()
            .filter((action) => action.getType() === "pickup");
        expect(pickupActionsAtWaypoint1.length).toBeGreaterThan(1);

        expect(targetPlanAfter!.getViolations().length).toBeGreaterThan(0);
    });

    liveTest("preserveOrder + keep the pickup location", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        await editor.assignShipments(2, ["order_10"], {
            strategy: PRESERVE_ORDER,
            afterWaypointIndex: 0
        });

        const modified = editor.getModifiedResult();
        const shipmentPlan = modified.getShipmentPlan("order_10");
        expect(shipmentPlan).toBeDefined();
        expect(shipmentPlan!.getAgentIndex()).toBe(2);

        const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(pickupAction).toBeDefined();
        expect(deliveryAction).toBeDefined();
        expect(pickupAction!.getWaypointIndex()).toBe(1);
        expect(deliveryAction!.getWaypointIndex()).toBe(2);
    });

    liveTest("preserveOrder + without position + deletion + deletion: preserve order", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const batchResult = new RoutePlannerResult(
            result.getCallOptions(),
            JSON.parse(JSON.stringify(result.getRaw()))
        );
        const batchEditor = new RoutePlannerResultEditor(batchResult);
        const targetAgentIndex = 2;
        const shipmentIds = ["order_8", "order_15"];

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const beforeWaypointCount = targetPlanBefore!.getWaypoints().length;

        const sourceByShipment = new Map<string, number | undefined>(
            shipmentIds.map((shipmentId) => [shipmentId, result.getShipmentPlan(shipmentId)?.getAgentIndex()])
        );

        await editor.assignShipments(targetAgentIndex, ["order_8"], {
            strategy: PRESERVE_ORDER,
            removeStrategy: PRESERVE_ORDER
        });
        await editor.assignShipments(targetAgentIndex, ["order_15"], {
            strategy: PRESERVE_ORDER,
            removeStrategy: PRESERVE_ORDER
        });

        const modified = editor.getModifiedResult();
        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.getWaypoints().length).toBe(beforeWaypointCount + 2);

        for (const shipmentId of shipmentIds) {
            expect(modified.getShipmentPlan(shipmentId)?.getAgentIndex()).toBe(targetAgentIndex);

            const sourceAgentIndex = sourceByShipment.get(shipmentId);
            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsShipment(shipmentId)).toBe(false);
                }
            }
        }

        const agentZeroPlan = modified.getAgentPlan(0);
        if (agentZeroPlan) {
            const forbiddenShipmentIds = new Set(["order_8", "order_9"]);
            const agentZeroForbiddenActions = agentZeroPlan
                .getActions()
                .filter((action) => forbiddenShipmentIds.has(action.getShipmentId() || ""));
            expect(agentZeroForbiddenActions.length).toBe(0);
        }

        const deliveryWaypointIndexes = shipmentIds
            .map((shipmentId) =>
                modified
                    .getShipmentPlan(shipmentId)
                    ?.getRouteActions()
                    .find((action) => action.getType() === "delivery")
                    ?.getWaypointIndex()
            )
            .filter((waypointIndex): waypointIndex is number => waypointIndex !== undefined)
            .sort((a, b) => a - b);

        expect(deliveryWaypointIndexes).toEqual([10, 11]);

        await batchEditor.assignShipments(targetAgentIndex, shipmentIds, {
            strategy: PRESERVE_ORDER,
            removeStrategy: PRESERVE_ORDER
        });
        const batchModified = batchEditor.getModifiedResult();
        expect(getShipmentsAssignmentSignature(batchModified)).toEqual(getShipmentsAssignmentSignature(modified));
    });


    liveTest("preserveOrder + middle position + deletion + reoptimize", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const sourceAgentIndex = 1;
        const shipmentId = "order_33";
        const afterWaypointIndex = 9;

        expect(result.getShipmentPlan(shipmentId)?.getAgentIndex()).toBe(sourceAgentIndex);

        await editor.assignShipments(targetAgentIndex, [shipmentId], {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex
        });

        const modified = editor.getModifiedResult();
        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        const shipmentPlan = modified.getShipmentPlan(shipmentId);

        expect(shipmentPlan).toBeDefined();
        expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

        if (sourcePlanAfter) {
            expect(sourcePlanAfter.containsShipment(shipmentId)).toBe(false);
        }

        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.containsShipment(shipmentId)).toBe(true);

        const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");

        expect(pickupAction).toBeDefined();
        expect(deliveryAction).toBeDefined();
        expect(pickupAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
        expect(deliveryAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
        expect(pickupAction!.getWaypointIndex()).toBeLessThan(deliveryAction!.getWaypointIndex() as number);
    });

    liveTest("preserveOrder + middle position + deletion + reoptimize - 2", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        await editor.assignShipments(2, ["order_32"], {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex: 5
        });

        const modified = editor.getModifiedResult();
        const shipmentPlan = modified.getShipmentPlan("order_32");
        expect(shipmentPlan).toBeDefined();
        expect(shipmentPlan!.getAgentIndex()).toBe(2);

        const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(pickupAction).toBeDefined();
        expect(deliveryAction).toBeDefined();
        expect(pickupAction!.getWaypointIndex()).toBe(9);
        expect(deliveryAction!.getWaypointIndex()).toBe(11);
    });

    liveTest("preserveOrder + add another shipment to a location", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );

        const removeEditor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const shipmentId = "order_73";

        const targetPlanBeforeRemove = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBeforeRemove).toBeDefined();
        expect(result.getShipmentPlan(shipmentId)?.getAgentIndex()).toBe(targetAgentIndex);
        const beforeRemoveWaypointCount = targetPlanBeforeRemove!.getWaypoints().length;

        await removeEditor.removeShipments([shipmentId], { strategy: PRESERVE_ORDER });
        const removedResult = removeEditor.getModifiedResult();
        const targetPlanAfterRemove = removedResult.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfterRemove).toBeDefined();
        expect(targetPlanAfterRemove!.getWaypoints().length).toBe(beforeRemoveWaypointCount);
        expect(removedResult.getShipmentPlan(shipmentId)?.getAgentIndex()).toBeUndefined();

        // 1) add it back without explicit "after"
        const noAfterEditor = new RoutePlannerResultEditor(
            new RoutePlannerResult(
                result.getCallOptions(),
                JSON.parse(JSON.stringify(removedResult.getRaw()))
            )
        );
        await noAfterEditor.assignShipments(targetAgentIndex, [shipmentId], { strategy: PRESERVE_ORDER });
        const noAfterResult = noAfterEditor.getModifiedResult();
        const noAfterPlan = noAfterResult.getShipmentPlan(shipmentId);
        expect(noAfterPlan).toBeDefined();
        const noAfterPickup = noAfterPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const noAfterDelivery = noAfterPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(noAfterPickup).toBeDefined();
        expect(noAfterDelivery).toBeDefined();
        expect(noAfterPickup!.getWaypointIndex()).toBe(1);
        expect(noAfterDelivery!.getWaypointIndex()).toBe(9);

        // 2) add it after waypoint 3
        const afterEditor = new RoutePlannerResultEditor(
            new RoutePlannerResult(
                result.getCallOptions(),
                JSON.parse(JSON.stringify(removedResult.getRaw()))
            )
        );
        await afterEditor.assignShipments(targetAgentIndex, [shipmentId], {
            strategy: PRESERVE_ORDER,
            afterWaypointIndex: 3
        });
        const afterResult = afterEditor.getModifiedResult();
        const afterPlan = afterResult.getShipmentPlan(shipmentId);
        expect(afterPlan).toBeDefined();
        const afterPickup = afterPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const afterDelivery = afterPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(afterPickup).toBeDefined();
        expect(afterDelivery).toBeDefined();
        expect(afterPickup!.getWaypointIndex()).toBeGreaterThan(3);
        expect(afterDelivery!.getWaypointIndex()).toBeGreaterThan(3);
        expect(afterDelivery!.getWaypointIndex()).toBe(10);
    });

    liveTest("preserveOrder + end position + exception + deletion + reoptimize", async () => {
        const inputData = loadJson(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        ) as RoutePlannerInputData;

        for (const agent of inputData.agents || []) {
            if (!agent.end_location && agent.start_location) {
                agent.end_location = [...agent.start_location] as [number, number];
            }
        }

        const planner = new RoutePlanner({ apiKey: LIVE_TEST_API_KEY }, inputData);
        const result = await planner.plan();
        const editor = new RoutePlannerResultEditor(result);

        const targetAgentIndex = result
            .getAgentPlans()
            .findIndex((agentPlan) =>
                !!agentPlan &&
                agentPlan.getWaypoints().some((waypoint) =>
                    waypoint.getActions().some((action) => action.getType() === "end")
                )
            );

        expect(targetAgentIndex).toBeGreaterThanOrEqual(0);

        const targetAgentPlan = result.getAgentPlan(targetAgentIndex);
        expect(targetAgentPlan).toBeDefined();

        const endWaypointIndex = targetAgentPlan!.getWaypoints().findIndex((waypoint) =>
            waypoint.getActions().some((action) => action.getType() === "end")
        );
        expect(endWaypointIndex).toBeGreaterThanOrEqual(0);

        const shipmentToAssign = result
            .getShipmentPlans()
            .find((shipmentPlan) =>
                shipmentPlan &&
                shipmentPlan.getAgentIndex() !== undefined &&
                shipmentPlan.getAgentIndex() !== targetAgentIndex
            )
            ?.getShipmentIndex();

        expect(shipmentToAssign).toBeDefined();

        await expect(
            editor.assignShipments(targetAgentIndex, [shipmentToAssign as number], {
                strategy: PRESERVE_ORDER,
                removeStrategy: REOPTIMIZE,
                afterWaypointIndex: endWaypointIndex,
                append: true
            })
        ).rejects.toThrow(`Cannot change the route after waypoint ${endWaypointIndex}`);
    });

    liveTest("preserveOrder + midle position + append + deletion + reoptimize", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const afterWaypointIndex = 3;

        const shipmentToMove = result
            .getShipmentPlans()
            .find((shipmentPlan) => {
                const agentIndex = shipmentPlan?.getAgentIndex();
                return agentIndex !== undefined && agentIndex !== targetAgentIndex;
            });

        expect(shipmentToMove).toBeDefined();
        const shipmentIndex = shipmentToMove!.getShipmentIndex();
        const sourceAgentIndex = shipmentToMove!.getAgentIndex() as number;

        await editor.assignShipments(targetAgentIndex, [shipmentIndex], {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex,
            append: true
        });

        const modified = editor.getModifiedResult();
        const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
        expect(shipmentPlan).toBeDefined();
        expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

        const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
        const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
        expect(pickupAction).toBeDefined();
        expect(deliveryAction).toBeDefined();

        // append + afterWaypointIndex should place shipment directly after the anchor waypoint
        expect(pickupAction!.getWaypointIndex()).toBe(afterWaypointIndex + 1);
        expect(deliveryAction!.getWaypointIndex()).toBe(afterWaypointIndex + 2);
        expect(pickupAction!.getWaypointIndex()).toBeLessThan(deliveryAction!.getWaypointIndex() as number);

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.containsShipment(shipmentIndex)).toBe(false);
        }
    });

    liveTest("preserveOrder + append + deletion + reoptimize", async () => {
        const baseInputFile =
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json";
        const targetAgentIndex = 2;

        const runAppendCase = async (result: any, expectEndWaypoint: boolean) => {
            const editor = new RoutePlannerResultEditor(result);

            const shipmentToMove = result
                .getShipmentPlans()
                .find((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan?.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                });
            expect(shipmentToMove).toBeDefined();

            const shipmentIndex = shipmentToMove!.getShipmentIndex();
            const sourceAgentIndex = shipmentToMove!.getAgentIndex() as number;

            await editor.assignShipments(targetAgentIndex, [shipmentIndex], {
                strategy: PRESERVE_ORDER,
                removeStrategy: REOPTIMIZE,
                append: true
            });

            const modified = editor.getModifiedResult();
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect(pickupAction!.getWaypointIndex()).toBeLessThan(deliveryAction!.getWaypointIndex() as number);

            if (sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsShipment(shipmentIndex)).toBe(false);
                }
            }

            const targetPlan = modified.getAgentPlan(targetAgentIndex);
            expect(targetPlan).toBeDefined();
            const waypoints = targetPlan!.getWaypoints();
            const endWaypointIndex = waypoints.findIndex((waypoint) =>
                waypoint.getActions().some((action) => action.getType() === "end")
            );

            if (expectEndWaypoint) {
                expect(endWaypointIndex).toBeGreaterThan(1);
                expect(deliveryAction!.getWaypointIndex()).toBe(endWaypointIndex - 1);
                expect(pickupAction!.getWaypointIndex()).toBe(endWaypointIndex - 2);
            } else {
                expect(endWaypointIndex).toBe(-1);
                expect(pickupAction!.getWaypointIndex()).toBe(waypoints.length - 2);
                expect(deliveryAction!.getWaypointIndex()).toBe(waypoints.length - 1);
            }
        };

        // case 1: with end location -> append should place pickup+delivery right before end waypoint
        const withEndInput = loadJson(baseInputFile) as RoutePlannerInputData;
        for (const agent of withEndInput.agents || []) {
            if (!agent.end_location && agent.start_location) {
                agent.end_location = [...agent.start_location] as [number, number];
            }
        }
        const withEndPlanner = new RoutePlanner({ apiKey: LIVE_TEST_API_KEY }, withEndInput);
        const withEndResult = await withEndPlanner.plan();
        await runAppendCase(withEndResult, true);

        // case 2: without end location -> append should place pickup+delivery at route end
        const withoutEndResult = await buildShipmentsResult(baseInputFile);
        await runAppendCase(withoutEndResult, false);
    });

    liveTest("preserveOrder + assign all unassigned", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;

        const getUnassignedShipmentIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getShipmentPlans()
                .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

        let current = editor.getModifiedResult();
        let unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);

        // Ensure this scenario always has unassigned shipments to test.
        if (!unassignedShipmentIndexes.length) {
            const candidates = current
                .getShipmentPlans()
                .filter((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

            if (candidates.length) {
                await editor.removeShipments(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);
            }
        }

        expect(unassignedShipmentIndexes.length).toBeGreaterThan(0);

        await editor.assignShipments(targetAgentIndex, unassignedShipmentIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();

        for (const shipmentIndex of unassignedShipmentIndexes) {
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);
        }

        const remainingUnassigned = modified
            .getShipmentPlans()
            .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined);
        expect(remainingUnassigned.length).toBe(0);

        expect(targetPlan!.getViolations().length).toBeGreaterThan(0);
    });

    liveTest("preserveOrder + assign all unassigned + append", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;

        const getUnassignedShipmentIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getShipmentPlans()
                .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

        let current = editor.getModifiedResult();
        let unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);

        if (!unassignedShipmentIndexes.length) {
            const candidates = current
                .getShipmentPlans()
                .filter((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

            if (candidates.length) {
                await editor.removeShipments(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);
            }
        }

        expect(unassignedShipmentIndexes.length).toBeGreaterThan(0);

        const beforeWaypointCount = current.getAgentPlan(targetAgentIndex)?.getWaypoints().length ?? 0;

        await editor.assignShipments(targetAgentIndex, unassignedShipmentIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            append: true
        });

        const modified = editor.getModifiedResult();
        const pickupWaypointIndexes: number[] = [];
        const deliveryWaypointIndexes: number[] = [];

        for (const shipmentIndex of unassignedShipmentIndexes) {
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);

            pickupWaypointIndexes.push(pickupAction!.getWaypointIndex() as number);
            deliveryWaypointIndexes.push(deliveryAction!.getWaypointIndex() as number);
        }

        // append=true without explicit position should place inserted shipments at route tail.
        expect(Math.min(...pickupWaypointIndexes)).toBeGreaterThanOrEqual(beforeWaypointCount - 1);
        expect(Math.min(...deliveryWaypointIndexes)).toBeGreaterThanOrEqual(beforeWaypointCount - 1);
    });

    liveTest("preserveOrder + assign all unassigned + position", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const afterWaypointIndex = 3;

        const getUnassignedShipmentIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getShipmentPlans()
                .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

        let current = editor.getModifiedResult();
        let unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);

        if (!unassignedShipmentIndexes.length) {
            const candidates = current
                .getShipmentPlans()
                .filter((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

            if (candidates.length) {
                await editor.removeShipments(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);
            }
        }

        expect(unassignedShipmentIndexes.length).toBeGreaterThan(0);

        await editor.assignShipments(targetAgentIndex, unassignedShipmentIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex
        });

        const modified = editor.getModifiedResult();
        for (const shipmentIndex of unassignedShipmentIndexes) {
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect(pickupAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
            expect(deliveryAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);
        }
    });

    liveTest("preserveOrder + assign all unassigned + position + append", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 2;
        const afterWaypointIndex = 3;

        const getUnassignedShipmentIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getShipmentPlans()
                .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

        let current = editor.getModifiedResult();
        let unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);

        if (!unassignedShipmentIndexes.length) {
            const candidates = current
                .getShipmentPlans()
                .filter((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

            if (candidates.length) {
                await editor.removeShipments(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);
            }
        }

        expect(unassignedShipmentIndexes.length).toBeGreaterThan(0);

        await editor.assignShipments(targetAgentIndex, unassignedShipmentIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex,
            append: true
        });

        const modified = editor.getModifiedResult();
        const insertedPickupWaypointIndexes: number[] = [];

        for (const shipmentIndex of unassignedShipmentIndexes) {
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect(pickupAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
            expect(deliveryAction!.getWaypointIndex()).toBeGreaterThan(afterWaypointIndex);
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);
            insertedPickupWaypointIndexes.push(pickupAction!.getWaypointIndex() as number);
        }

        // With append=true and explicit position, first inserted pickup should be right after anchor.
        expect(Math.min(...insertedPickupWaypointIndexes)).toBe(afterWaypointIndex + 1);
    });

    liveTest("reoptimize + without position + deletion + reoptimize", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const movingShipments = ["order_45", "order_73"];

        const sourceByShipment = new Map<string, number | undefined>(
            movingShipments.map((shipmentId) => [shipmentId, result.getShipmentPlan(shipmentId)!.getAgentIndex()])
        );

        const targetShipmentsBefore = result.getAgentPlan(targetAgentIndex)?.getPlannedShipments().length ?? 0;

        await editor.assignShipments(targetAgentIndex, movingShipments, {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();
        expect(targetPlan!.getPlannedShipments().length).toBe(targetShipmentsBefore + movingShipments.length);

        for (const shipmentId of movingShipments) {
            const shipmentPlan = modified.getShipmentPlan(shipmentId);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);
            expect(targetPlan?.containsShipment(shipmentId)).toBe(true);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);

            const sourceAgentIndex = sourceByShipment.get(shipmentId);
            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsShipment(shipmentId)).toBe(false);
                }
            }
        }
    });


    liveTest("reoptimize + assign all unassigned", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const getUnassignedShipmentIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getShipmentPlans()
                .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

        let current = editor.getModifiedResult();
        let unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);

        if (!unassignedShipmentIndexes.length) {
            const candidates = current
                .getShipmentPlans()
                .filter((shipmentPlan: any) => {
                    const agentIndex = shipmentPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((shipmentPlan: any) => shipmentPlan.getShipmentIndex());

            if (candidates.length) {
                await editor.removeShipments(candidates, { strategy: REOPTIMIZE });
                current = editor.getModifiedResult();
                unassignedShipmentIndexes = getUnassignedShipmentIndexes(current);
            }
        }

        expect(unassignedShipmentIndexes.length).toBeGreaterThan(0);

        await editor.assignShipments(targetAgentIndex, unassignedShipmentIndexes, {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();

        for (const shipmentIndex of unassignedShipmentIndexes) {
            const shipmentPlan = modified.getShipmentPlan(shipmentIndex);
            expect(shipmentPlan).toBeDefined();
            expect(shipmentPlan!.getAgentIndex()).toBe(targetAgentIndex);

            const pickupAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "pickup");
            const deliveryAction = shipmentPlan!.getRouteActions().find((action) => action.getType() === "delivery");
            expect(pickupAction).toBeDefined();
            expect(deliveryAction).toBeDefined();
            expect((pickupAction!.getWaypointIndex() as number)).toBeLessThan(deliveryAction!.getWaypointIndex() as number);
        }

        const remainingUnassigned = modified
            .getShipmentPlans()
            .filter((shipmentPlan: any) => shipmentPlan.getAgentIndex() === undefined);
        expect(remainingUnassigned.length).toBe(0);
    });
});
