import { RoutePlanner } from "./route-planner";
import { RoutePlannerResultEditor } from "./route-planner-result-editor";
import * as Models from "./models";

export * from "./models";
export { RoutePlanner, RoutePlannerResultEditor };
export default RoutePlanner;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlanner: RoutePlanner,
        RouteEditor: RoutePlannerResultEditor,
        ...Models
    };
}