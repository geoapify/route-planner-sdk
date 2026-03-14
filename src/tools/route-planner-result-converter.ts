import {
  ActionResponseData, AgentPlanData,
  FeatureResponseData, LegResponseData, LegStepResponseData,
  RoutePlannerResultData,
  RoutePlannerResultResponseData, WaypointResponseData
} from "../models";
import {Utils} from "./utils";

export class RoutePlannerResultConverter {

  public static generateRoutePlannerResultData(response: RoutePlannerResultResponseData): RoutePlannerResultData {
    let clonedResponse = Utils.cloneObject(response);
    return {
      agents: this.generateAgents(clonedResponse),
      inputData: clonedResponse.properties.params,
      unassignedAgents: clonedResponse.properties.issues?.unassigned_agents,
      unassignedJobs: clonedResponse.properties.issues?.unassigned_jobs,
      unassignedShipments: clonedResponse.properties.issues?.unassigned_shipments
    }
  }

  private static generateAgents(response: RoutePlannerResultResponseData): AgentPlanData[] {
    let result: AgentPlanData[] = [];
    response.features.forEach((feature: FeatureResponseData) => {
      let properties = feature.properties;
      result.push({
        agentIndex: properties.agent_index,
        agentId: properties.agent_id,
        time: properties.time,
        start_time: properties.start_time,
        end_time: properties.end_time,
        distance: properties.distance,
        mode: properties.mode,
        legs: properties.legs,
        actions: properties.actions,
        waypoints: properties.waypoints
      })
    });
    return result;
  }
}
