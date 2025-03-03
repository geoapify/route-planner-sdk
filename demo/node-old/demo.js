import RoutePlannerSDK from "../../dist/route-planner-sdk.esm.js";

async function main() {
    // Remove fetch to simulate an environment where it's not available
    globalThis.fetch = undefined;

    const apiKey = "YOUR_API_KEY"; // Replace with a real API key
    const result = await RoutePlannerSDK.testConnection(apiKey);
    console.log("API Status:", result);
}

main().catch(console.error);
