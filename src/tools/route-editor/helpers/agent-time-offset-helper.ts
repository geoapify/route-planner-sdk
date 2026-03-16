import { IndexConverter } from "../../../helpers/index-converter";
import { InvalidInsertionPosition } from "../../../models";
import { InsertPositionResolver } from "../strategies";
import { RouteResultEditorBase } from "../route-result-editor-base";
import { RouteViolationValidator } from "../validations";

export class AgentTimeOffsetHelper {

    static execute(context: RouteResultEditorBase, agentIdOrIndex: string | number,
                   waypointIndex: number, offsetSeconds: number): void {
        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), agentIdOrIndex, true);

        const actions = context.getAgentActions(agentIndex);
        const waypoints = context.getAgentWaypoints(agentIndex);
        if (actions.length === 0) {
            return;
        }

        InsertPositionResolver.validateAfterWaypointIndex(context, agentIndex, waypointIndex);

        const agentFeature = context.getRawData().features.find(
            (feature) => feature.properties.agent_index === agentIndex
        );
        const legToUpdate = agentFeature?.properties.legs?.find(
            (leg) => leg.from_waypoint_index === waypointIndex
        );

        if (legToUpdate) {
            const newLegTime = (legToUpdate.time || 0) + offsetSeconds;
            if (newLegTime <= 0) {
                throw new InvalidInsertionPosition(
                    `Leg time must stay positive after offset on waypoint ${waypointIndex}`,
                    agentIndex,
                    waypointIndex
                );
            }
        }

        for (let i = waypointIndex + 1 /* after */; i < waypoints.length; i++) {
            waypoints[i].start_time = (waypoints[i].start_time || 0) + offsetSeconds;
            if (waypoints[i].actions) {
                for (const action of waypoints[i].actions) {
                    action.start_time = (action.start_time || 0) + offsetSeconds;
                    actions[action.index].start_time = action.start_time;
                }
            }
        }

        if (legToUpdate) {
            legToUpdate.time = (legToUpdate.time || 0) + offsetSeconds;
        }

        if (agentFeature) {
            agentFeature.properties.end_time = (agentFeature.properties.end_time || 0) + offsetSeconds;
        }

        RouteViolationValidator.validate(context, agentIndex);
    }
}
