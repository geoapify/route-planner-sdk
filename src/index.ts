import { RoutePlannerSDK } from "./route-planner-sdk";
import * as Models from "./models";

export * from "./models";
export { RoutePlannerSDK };

export default RoutePlannerSDK;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlannerSDK: RoutePlannerSDK,
        ...Models
    };
}