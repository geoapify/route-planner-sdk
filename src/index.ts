import { RoutePlanner } from "./route-planner";
import { RoutePlannerResultEditor } from "./route-planner-result-editor";
import * as Models from "./models";
import { AgentTimeline } from "./agent-timeline";

export * from "./models";
export { RoutePlanner, RoutePlannerResultEditor, AgentTimeline };

export default RoutePlanner;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlanner: RoutePlanner,
        AgentTimeline: AgentTimeline,
        RouteEditor: RoutePlannerResultEditor,
        ...Models
    };
}
