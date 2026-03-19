import { IndexConverter } from "../../../helpers/index-converter";
import { InsertPositionResolver } from "../strategies";
import { RouteResultEditorBase } from "../route-result-editor-base";
import { RouteViolationValidator } from "../validations";

export class AgentTimeOffsetHelper {

    static execute(context: RouteResultEditorBase, agentIdOrIndex: string | number,
                   waypointIndex: number, delaySeconds: number): void {
        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), agentIdOrIndex, true);
        const agentFeature = context.getAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const waypoints = agentFeature.properties.waypoints;
        if (actions.length === 0) {
            return;
        }

        InsertPositionResolver.validateAfterWaypointIndex(context, agentIndex, waypointIndex);

        if (delaySeconds !== 0) {
            this.applyDelayAction(actions, waypoints, waypointIndex, delaySeconds);
        }

        agentFeature.properties.end_time = (agentFeature.properties.end_time || 0) + delaySeconds;

        RouteViolationValidator.validate(context, agentIndex);
    }

    private static applyDelayAction(actions: any[], waypoints: any[], waypointAfterIndex: number, delaySeconds: number): void {
        const targetWaypointIndex = waypointAfterIndex + 1;
        if (targetWaypointIndex >= waypoints.length) {
            return;
        }

        const targetWaypoint = waypoints[targetWaypointIndex];
        if (!targetWaypoint?.actions?.length) {
            return;
        }

        const firstWaypointAction = targetWaypoint.actions[0];
        const insertionPosition = actions.findIndex((action) => action.index === firstWaypointAction.index);
        if (insertionPosition < 0) {
            return;
        }

        let delayAction = actions[insertionPosition - 1];
        if (delayAction?.type === "delay") {
            delayAction.start_time = firstWaypointAction.start_time ?? targetWaypoint.start_time ?? 0;
            delayAction.duration = (delayAction.duration || 0) + delaySeconds;
        } else {
            delayAction = {
                type: "delay",
                index: insertionPosition,
                start_time: firstWaypointAction.start_time ?? targetWaypoint.start_time ?? 0,
                duration: delaySeconds
            };
            actions.splice(insertionPosition, 0, delayAction);

            for (let i = insertionPosition + 1; i < actions.length; i++) {
                actions[i].index += 1;
            }

            for (let i = 0; i < waypoints.length; i++) {
                const waypoint = waypoints[i];
                for (let actionIndex = 0; actionIndex < waypoint.actions.length; actionIndex++) {
                    const action = waypoint.actions[actionIndex];
                    if (action.index >= insertionPosition) {
                        action.index += 1;
                    }
                }
            }
        }

        const shiftedActionIndices = new Set<number>();
        for (let waypointIndex = targetWaypointIndex; waypointIndex < waypoints.length; waypointIndex++) {
            const waypoint = waypoints[waypointIndex];
            waypoint.start_time = (waypoint.start_time || 0) + delaySeconds;

            for (let actionIndex = 0; actionIndex < waypoint.actions.length; actionIndex++) {
                const action = waypoint.actions[actionIndex];
                action.start_time = (action.start_time || 0) + delaySeconds;
                shiftedActionIndices.add(action.index);
                actions[action.index].start_time = action.start_time;
            }
        }

        // Shift standalone actions (e.g. delays/breaks between waypoints) after inserted delay.
        for (const action of actions) {
            if (action.index <= delayAction.index) {
                continue;
            }
            if (shiftedActionIndices.has(action.index)) {
                continue;
            }
            action.start_time = (action.start_time || 0) + delaySeconds;
        }

        if (delayAction.duration === 0) {
            this.removeActionAndReindex(actions, waypoints, delayAction.index);
        }
    }

    private static removeActionAndReindex(actions: any[], waypoints: any[], removeIndex: number): void {
        actions.splice(removeIndex, 1);

        for (let index = removeIndex; index < actions.length; index++) {
            actions[index].index = index;
        }

        for (const waypoint of waypoints) {
            if (!waypoint?.actions?.length) {
                continue;
            }
            for (const action of waypoint.actions) {
                if (action.index > removeIndex) {
                    action.index -= 1;
                }
            }
        }
    }
}
