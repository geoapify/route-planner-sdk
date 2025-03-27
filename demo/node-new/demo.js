import RoutePlanner, {Agent, Job, Shipment, ShipmentStep, RoutePlannerResultEditor} from "../../dist/index.min.esm.js";
import TEST_API_KEY from "../../demo-env-variables.mjs";

const apiKey = TEST_API_KEY;

async function makeSimpleRoutePlannerRequest() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
        .plan();
    console.log("Route Planner result:", result);
}

makeSimpleRoutePlannerRequest().catch(console.error);

async function makeSimpleDeliveryRoutePlannerRequest() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-2").setStartLocation(13.38, 52.52))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-1"))
        .plan();
    console.log("Delivery Route Planner result:", result);
}

makeSimpleDeliveryRoutePlannerRequest().catch(console.error);

async function addJobToAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const jobResult = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
        .plan();

    const routeEditor = new RoutePlannerResultEditor(jobResult);

    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setId("job-5");

    await routeEditor.addNewJobs('agent-1', [newJob]);
    let modifiedResult = routeEditor.getModifiedResult();

    console.log("Job added to agent", modifiedResult);
}

addJobToAgent().catch(console.error);

async function addShipmentToAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-1"))
        .plan();

    const routeEditor = new RoutePlannerResultEditor(result);

    let newShipment = new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-5");

    await routeEditor.addNewShipments('agent-1', [newShipment]);
    let modifiedResult = routeEditor.getModifiedResult();

    console.log("Shipment added to agent", modifiedResult);
}

addShipmentToAgent().catch(console.error);

async function assignJobToAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const jobResult = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(44.50893067594133, 40.17748295).setEndLocation(44.50893067594133, 40.17748295))
        .addAgent(new Agent().setId("agent-2").setStartLocation(44.50893067594133, 40.17748295).setEndLocation(44.50893067594133, 40.17748295))
        .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
        .addJob(new Job().setId("job-2").setLocation(44.50163440259088, 40.17967885))
        .addJob(new Job().setId("job-3").setLocation(44.50163440259088, 40.17967885))
        .addJob(new Job().setId("job-4").setLocation(44.50163440259088, 40.17967885))
        .addJob(new Job().setId("job-5").setLocation(44.50063440259088, 40.16967885))
        .addJob(new Job().setId("job-6").setLocation(44.45063440259088, 40.15967885))
        .plan();

    const routeEditor = new RoutePlannerResultEditor(jobResult);

    await routeEditor.assignJobs("agent-2", ['job-6']);

    let modifiedResult = routeEditor.getModifiedResult();
    console.log("Job assigned to agent", modifiedResult);
}

assignJobToAgent().catch(console.error);

async function assignShipmentToAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addAgent(new Agent().setId("agent-2").setStartLocation(13.38, 40.52))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-1"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-2"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-3"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-4"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-5"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-6"))
        .plan();

    const routeEditor = new RoutePlannerResultEditor(result);

    await routeEditor.assignShipments("agent-2", ['shipment-6']);

    let modifiedResult = routeEditor.getModifiedResult();
    console.log("Shipment assigned to agent", modifiedResult);
}

assignShipmentToAgent().catch(console.error);

async function removeJobFromAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const jobResult = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-2").setStartLocation(13.38, 52.52))
        .addJob(new Job().setId("job-2").setLocation(13.39, 52.51))
        .addJob(new Job().setId("job-3").setLocation(13.39, 52.51))
        .plan();
    const routeEditor = new RoutePlannerResultEditor(jobResult);

    await routeEditor.removeJobs(['job-3']);
    let modifiedResult = routeEditor.getModifiedResult();

    console.log("Job removed from agent", modifiedResult);
}

removeJobFromAgent().catch(console.error);

async function removeShipmentFromAgent() {
    const planner = new RoutePlanner({apiKey: apiKey});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-2").setStartLocation(13.38, 52.52))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-1"))
        .addShipment(new Shipment()
            .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
            .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
            .addRequirement('heavy-items')
            .setId("shipment-2"))
        .plan();

    const routeEditor = new RoutePlannerResultEditor(result);

    await routeEditor.removeShipments(['shipment-2']);
    let modifiedResult = routeEditor.getModifiedResult();

    console.log("Shipment removed from agent", modifiedResult);
}

removeShipmentFromAgent().catch(console.error);