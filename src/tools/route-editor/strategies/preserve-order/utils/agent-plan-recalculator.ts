import {ActionResponseData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {LegRecalculator} from "./leg-recalculator";

export class AgentPlanRecalculator {
    static async recalculate(context: RouteResultEditorBase, agentIndex: number): Promise<void> {
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const legs = agentFeature.properties.legs || [];

        await LegRecalculator.fillMissingLegData(context, agentFeature);

        // we start at currect agent time
        let time = agentFeature.properties.start_time;

        const actions: ActionResponseData[] = [];

        for(let i = 0; i < waypoints.length; i ++) {
            const fromPrevWaypointTravelTime = i > 0 ? legs[i - 1].time : 0;

            time += fromPrevWaypointTravelTime;
            waypoints[i].start_time = time;

            // update leg indexes
            if (i === 0)
                delete waypoints[i].prev_leg_index
            else 
                waypoints[i].prev_leg_index = i - 1;

            if (i === waypoints.length - 1) 
                delete waypoints[i].next_leg_index;
            else
                waypoints[i].next_leg_index = i;

            // update actions
            waypoints[i].actions.forEach(action => {
                action.waypoint_index = i;
                action.index = actions.length;
                action.start_time = time;
                time += action.duration || 0;

                actions.push(action);
            });

            waypoints[i].duration = time - waypoints[i].start_time;

            // update locations
            if (i < waypoints.length - 1) {
                const correspondingGeometry = agentFeature.geometry.coordinates[i];
                waypoints[i].location = correspondingGeometry[0];
            } else {
                const correspondingGeometry = agentFeature.geometry.coordinates[i - 1];
                waypoints[i].location = correspondingGeometry[correspondingGeometry.length - 1];
            }            
        }    
        agentFeature.properties.end_time = time;
        agentFeature.properties.actions = actions;
        agentFeature.properties.distance = legs.reduce((sum, leg) => {
            return sum + leg.distance;
        }, 0);
    }
}
