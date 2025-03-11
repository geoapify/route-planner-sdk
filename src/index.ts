import { RoutePlannerSDK } from "./route-planner-sdk";
import { RouteEditor } from "./tools/route-editor";
import * as Models from "./models";

export * from "./models";
export { RoutePlannerSDK, RouteEditor };
export default RoutePlannerSDK;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlannerSDK: RoutePlannerSDK,
        RouteEditor: RouteEditor,
        ...Models
    };
}