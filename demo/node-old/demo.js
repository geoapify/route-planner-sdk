import RoutePlanner, {Agent, Job} from "../../dist/route-planner-sdk.esm.js";

const apiKey = "TEST_API_KEY"; // Replace with a real API key

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
