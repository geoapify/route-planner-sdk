import { RoutePlanner } from "./route-planner";
import { RouteEditor } from "./tools/route-editor";
import * as Models from "./models";

export * from "./models";
export { RoutePlanner, RouteEditor };
export default RoutePlanner;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlanner: RoutePlanner,
        RouteEditor: RouteEditor,
        ...Models
    };
}