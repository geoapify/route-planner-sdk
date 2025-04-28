import { RoutePlanner } from "./route-planner";
import { RoutePlannerResultEditor } from "./route-planner-result-editor";
import * as Models from "./models";
import { RoutePlannerTimeline } from "./route-planner-timeline";

export * from "./models";
export { RoutePlanner, RoutePlannerResultEditor, RoutePlannerTimeline };

export default RoutePlanner;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlanner: RoutePlanner,
        RouteEditor: RoutePlannerResultEditor,
        AgentTimelineGenerator: RoutePlannerTimeline,
        ...Models
    };
}
