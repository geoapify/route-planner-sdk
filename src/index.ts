import { RoutePlanner } from "./route-planner";
import { RoutePlannerResultEditor } from "./route-planner-result-editor";
import * as Models from "./models";
import { AgentTimelineGenerator } from "./agent-timeline-generator";

export * from "./models";
export { RoutePlanner, RoutePlannerResultEditor, AgentTimelineGenerator };

export default RoutePlanner;

// Ensure proper UMD export for browsers
if (typeof window !== "undefined") {
    (window as any).RoutePlannerSDK = {
        RoutePlanner: RoutePlanner,
        RouteEditor: RoutePlannerResultEditor,
        AgentTimelineGenerator: AgentTimelineGenerator,
        ...Models
    };
}
