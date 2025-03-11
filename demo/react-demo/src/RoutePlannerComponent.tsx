import React, { useState } from "react";
import RoutePlannerSDK, { RouteAgent, RouteJob } from "./dist/route-planner-sdk.esm";

const RoutePlannerComponent: React.FC = () => {
    const [testConnectionResult, setTestConnectionResult] = useState<string>("");
    const [simpleRequestResult, setSimpleRequestResult] = useState<string>("");

    const checkConnection = async () => {
        try {
            const response = await RoutePlannerSDK.testConnection("YOUR_API_KEY");
            setTestConnectionResult(response);
        } catch (error) {
            console.error("API Error:", error);
            setTestConnectionResult("Error connecting to API");
        }
    };

    const makeSimpleRequest = async () => {
        try {
            const sdk = new RoutePlannerSDK("API_KEY");
            const response = await sdk
                .setMode("drive")
                .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
                .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
                .plan();
            setSimpleRequestResult(JSON.stringify(response));
        } catch (error) {
            console.error("API Error:", error);
            setSimpleRequestResult("Error processing request");
        }
    };

    return (
        <div>
            <h1>Route Planner Connection Test</h1>
            <button onClick={checkConnection}>Check API</button>
            <p>{testConnectionResult}</p>

            <h1>Route Planner Simple Request</h1>
            <button onClick={makeSimpleRequest}>Simple Request</button>
            <p>{simpleRequestResult}</p>
        </div>
    );
};

export default RoutePlannerComponent;
