import React, { useEffect, useState } from "react";
import RoutePlannerSDK from "./dist/route-planner-sdk.esm";


const RoutePlannerComponent: React.FC = () => {
    const [result, setResult] = useState<string>("");

    useEffect(() => {
        async function checkAPI() {
            try {
                const response = await RoutePlannerSDK.testConnection("YOUR_API_KEY");
                setResult(response);
            } catch (error) {
                console.error("API Error:", error);
                setResult("API Error");
            }
        }
        checkAPI();
    }, []);

    return (
        <div>
            <h1>Route Planner SDK</h1>
            <p>API Status: {result}</p>
        </div>
    );
};

export default RoutePlannerComponent;
