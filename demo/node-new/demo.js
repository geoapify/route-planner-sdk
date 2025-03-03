import RoutePlannerSDK from "../../dist/route-planner-sdk.esm.js";

async function main() {
    const apiKey = "YOUR_API_KEY"; // Replace with a real API key
    const result = await RoutePlannerSDK.testConnection(apiKey);
    console.log("API Status:", result);
}

main()
    .catch(console.error)
    .finally(() => process.exit(0)); // Force exit after execution
