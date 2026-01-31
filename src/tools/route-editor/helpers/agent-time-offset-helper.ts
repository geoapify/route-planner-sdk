import { IndexConverter } from "../../../helpers/index-converter";
import { InsertPositionResolver } from "../strategies";
import { RouteResultEditorBase } from "../route-result-editor-base";

export class AgentTimeOffsetHelper {

    static execute(context: RouteResultEditorBase, agentIdOrIndex: string | number,
                   waypointIndex: number, offsetSeconds: number): void {
        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), agentIdOrIndex, true);

        const actions = context.getAgentActions(agentIndex);
        const waypoints = context.getAgentWaypoints(agentIndex);
        if (actions.length === 0) {
            return;
        }

        const actionStartIndex = InsertPositionResolver.validateAndGetWaypointIndex(context, agentIndex, waypointIndex);

        for (let i = actionStartIndex; i < actions.length; i++) {
            actions[i].start_time = (actions[i].start_time || 0) + offsetSeconds;
        }

        for (let i = waypointIndex; i < waypoints.length; i++) {
            waypoints[i].start_time = (waypoints[i].start_time || 0) + offsetSeconds;
            if (waypoints[i].actions) {
                for (const action of waypoints[i].actions) {
                    action.start_time = (action.start_time || 0) + offsetSeconds;
                }
            }
        }

        const rawData = context.getRawData();
        const agentFeature = rawData.features.find(f => f.properties.agent_index === agentIndex);
        if (agentFeature) {
            agentFeature.properties.end_time = (agentFeature.properties.end_time || 0) + offsetSeconds;
        }
    }
}

