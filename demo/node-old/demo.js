import RoutePlannerSDK, {RouteAgent, RouteJob} from "../../dist/route-planner-sdk.esm.js";

const apiKey = "93b8e26606dd485183dcdab30f239f81"; // Replace with a real API key

async function main() {
    // Remove fetch to simulate an environment where it's not available
    globalThis.fetch = undefined;

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

main().catch(console.error);
makeSimpleRoutePlannerRequest().catch(console.error);
