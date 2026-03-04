import {RouteResultEditorBase} from "../../../route-result-editor-base";

export class PreserveOrderBaseHelper {

    static async getEndPosition(context: RouteResultEditorBase, agentIndex: number): Promise<number> {
        const agentFeature = await context.getOrCreateAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints || [];
        if (waypoints.length === 0) {
            return 0;
        }

        const lastWaypointIndex = waypoints.length - 1;
        const hasEndAction = (waypoints[lastWaypointIndex].actions || [])
            .some((action: any) => action.type === "end");

        return hasEndAction ? lastWaypointIndex : lastWaypointIndex + 1;
    }

    protected static hasAgentStartLocation(context: RouteResultEditorBase, agentIndex: number): boolean {
        const agent = context.getRawData().properties.params.agents[agentIndex];
        return agent.start_location_index !== undefined || agent.start_location !== undefined;
    }

    protected static hasAgentEndLocation(context: RouteResultEditorBase, agentIndex: number): boolean {
        const agent = context.getRawData().properties.params.agents[agentIndex];
        return agent.end_location_index !== undefined || agent.end_location !== undefined;
    }
}
