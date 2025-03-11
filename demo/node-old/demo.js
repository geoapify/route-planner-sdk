import RoutePlanner, {RouteAgent, RouteJob} from "../../dist/route-planner-sdk.esm.js";

const apiKey = "API_KEY"; // Replace with a real API key

async function makeSimpleRoutePlannerRequest() {
    const planner = new RoutePlanner(apiKey);

    const result = await planner
        .setMode("drive")
        .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
        .plan();
    console.log("Route Planner result:", result);
}

makeSimpleRoutePlannerRequest().catch(console.error);
