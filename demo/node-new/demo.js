import RoutePlannerSDK, {RouteAgent, RouteJob} from "../../dist/route-planner-sdk.esm.js";

const apiKey = "API_KEY"; // Replace with a real API key

async function testConnection() {
    const result = await RoutePlannerSDK.testConnection(apiKey);
    console.log("API Status:", result);
}

async function makeSimpleRoutePlannerRequest() {
    const planner = new RoutePlannerSDK(apiKey);

    const result = await planner
        .setMode("drive")
        .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
        .plan();
    console.log("Route Planner result:", result);
}


testConnection().catch(console.error);

makeSimpleRoutePlannerRequest().catch(console.error);

