import {
  AgentPlanData,
  FeatureResponseData,
  RoutePlannerResultData,
  RoutePlannerResultResponseData
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
      result.push(feature.properties);
    });
    return result;
  }
}
