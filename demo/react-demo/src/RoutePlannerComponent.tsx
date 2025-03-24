import React, { useState } from "react";
import RoutePlanner, { Agent, Job } from "./dist/route-planner-sdk.esm";
import TEST_API_KEY from "./env-variables";

const RoutePlannerComponent: React.FC = () => {
    const [simpleRequestResult, setSimpleRequestResult] = useState<string>("");

    const makeSimpleRequest = async () => {
        try {
            const sdk = new RoutePlanner({apiKey: TEST_API_KEY});
            const response = await sdk
                .setMode("drive")
                .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
                .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
                .plan();
            setSimpleRequestResult(JSON.stringify(response));
        } catch (error) {
            console.error("API Error:", error);
            setSimpleRequestResult("Error processing request");
        }
    };

    return (
        <div>
            <h1>Route Planner Simple Request</h1>
            <button onClick={makeSimpleRequest}>Simple Request</button>
            <p>{simpleRequestResult}</p>
        </div>
    );
};

export default RoutePlannerComponent;
