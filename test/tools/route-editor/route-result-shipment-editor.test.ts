import RoutePlanner, {
    RoutePlannerResultEditor,
    RoutePlannerResultData, Agent, Job, Shipment, ShipmentStep,
} from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";
import TEST_API_KEY from "../../../env-variables";
import {RoutePlannerResultReverseConverter} from "../../route-planner-result-reverse-converter";

const API_KEY = TEST_API_KEY;

describe('RoutePlannerResultShipmentEditor', () => {

    test('assignShipments should work as expected for simple case"', async () => {
        const planner = new RoutePlanner({apiKey: API_KEY});

        planner.setMode("drive");

        planner.addAgent(new Agent()
            .setStartLocation(44.50932929564537, 40.18686625)
            .addCapability('heavy-items')
            .setId("agent-A"));

        planner.addAgent(new Agent()
            .setStartLocation(44.400450399509495,40.153735600000005)
            .addCapability('small-items')
            .setId("agent-B"));

        planner.addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-1"));
        planner.addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-2"));
        planner.addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.517954005538606, 40.18518455).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('small-items')
            .setId("shipment-3"));
        planner.addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.5095432, 40.18665755000001).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('small-items')
            .setId("shipment-4"));

        const result = await planner.plan();
        expect(result).toBeDefined();
        expect(result.getAgentSolutions().length).toBe(2);
        expect(result.getData().inputData).toBeDefined();

        const routeEditor = new RoutePlannerResultEditor(result);
        let modifiedResult = routeEditor.getModifiedResult();
        modifiedResult.getRawData().properties.params.agents.forEach(agent => {
            agent.capabilities = ['heavy-items', 'small-items'];
        })
        let agentToAssignTheShipment = result.getShipmentInfo('shipment-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-B';
        await routeEditor.assignShipments(agentToAssignTheShipment, ['shipment-2']);
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe(agentToAssignTheShipment);
    });

    test('assignShipments should work "AgentSolution for provided agentId is found and the shipment is assigned to someone else."', async () => {
        let assignShipmentRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> Agent A, Shipment 2 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignShipments('agent-A', ['shipment-3']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Shipment 1 -> Agent A, Shipment 2 -> Agent A
        // Shipment 3 -> Agent A, Shipment 4 -> Agent B
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    });

    test('assignShipments should work "AgentSolution for provided agentId is found. But the shipment is not assigned to anyone."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignShipments('agent-A', ['shipment-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Shipment 1 -> Agent A, Shipment 2 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedShipments().length).toBe(0);
    });

    test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is assigned to someone."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignShipments('agent-B', ['shipment-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Shipment 1 -> A, Shipment 2 -> Agent B
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
        expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedShipments().length).toBe(2);
        expect(modifiedResult.getUnassignedShipments()[0]).toEqual(modifiedResult.getRawData().properties.params.shipments[2]);
        expect(modifiedResult.getUnassignedShipments()[1]).toEqual(modifiedResult.getRawData().properties.params.shipments[3]);
    });

    test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is not assigned to anyone."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignShipments('agent-B', ['shipment-3']);
        let modifiedResult = routeEditor.getModifiedResult();
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> B, Shipment 4 -> unassigned
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedShipments().length).toBe(1);
        expect(modifiedResult.getUnassignedShipments()[0]).toEqual(modifiedResult.getRawData().properties.params.shipments[3]);
    });

    test('assignShipments should work "Shipment with provided shipmentId already assigned to provided agentId."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.assignShipments('agent-A', ['shipment-1']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipment with id shipment-1 already assigned to agent agent-A');
        }
    });

    test('assignShipments should work "Shipment with provided shipmentId not found."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.assignShipments('agent-A', ['shipment-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipment with id shipment-5 not found');
        }
    });

    test('removeShipments should work "Shipment is assigned."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.removeShipments(['shipment-4']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After removal we should have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B
        // Shipment 2 -> unassigned
        // Shipment 4 -> unassigned
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')).toBeUndefined();
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedShipments().length).toBe(2);
        expect(modifiedResult.getUnassignedShipments()[0]).toEqual(modifiedResult.getRawData().properties.params.shipments[1]);
    });

    test('removeShipments should work "Shipment is not assigned."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.removeShipments(['shipment-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After removal we should have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')).toBeUndefined();
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedShipments().length).toBe(0);
    });

    test('removeShipments should work "Shipment not found."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeShipments(['shipment-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipment with id shipment-5 not found');
        }
    });

    test('removeShipments should work "No shipments provided."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeShipments([]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('No shipments provided');
        }
    });

    test('removeShipments should work "Shipments are not unique."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
        // Initially we have
        // Shipment 1 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeShipments(['shipment-5', 'shipment-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipments are not unique');
        }
    });

    test('addNewShipments should work "Shipment assigned to agent, that has existing AgentSolution."', async () => {
        let assignShipmentRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-add-shipment-success-assigned-agent.json");
        // Initially we have
        // Shipment 1 -> Agent A, Shipment 2 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newShipment = new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-5");
        await routeEditor.addNewShipments('agent-A', [newShipment]);
        let modifiedResult = routeEditor.getModifiedResult();
        // After adding we should have
        // Shipment 1 -> Agent A, Shipment 2 -> Agent A
        // Shipment 3 -> Agent B, Shipment 4 -> Agent B
        // Shipment 5 -> Agent A
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-A');
    });

    test('addNewShipments should work "Shipment assigned to agent without existing AgentSolution."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newShipment = new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-5");
        await routeEditor.addNewShipments('agent-B', [newShipment]);
        let modifiedResult = routeEditor.getModifiedResult();
        // After adding we should have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Shipment 5 -> Agent B
        expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
        expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
        expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedShipments().length).toBe(2);
        expect(modifiedResult.getUnassignedShipments()[0]).toEqual(modifiedResult.getRawData().properties.params.shipments[2]);
        expect(modifiedResult.getUnassignedShipments()[1]).toEqual(modifiedResult.getRawData().properties.params.shipments[3]);
    });

    test('addNewShipments should work "No shipments provided."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.addNewShipments('agent-B', []);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('No shipments provided');
        }
    });

    test('addNewShipments should work "Shipments are not unique."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newShipment = new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-5");
        try {
            await routeEditor.addNewShipments('agent-B', [newShipment, newShipment]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipments are not unique');
        }
    });

    test('addNewShipments should work "Shipment id is undefined."', async () => {
        let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
        // Initially we have
        // Shipment 1 -> A, Shipment 2 -> Agent A
        // Shipment 3 -> unassigned, Shipment 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newShipment = new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items');
        try {
            await routeEditor.addNewShipments('agent-B', [newShipment]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Shipment id is undefined');
        }
    });
});
