import { RoutePlannerResult } from "../models/entities/route-planner-result";
import {
  ActionResponseData,
  AgentSolutionData,
  FeatureResponseData, LegResponseData, LegStepResponseData, RouteActionData, RouteLegData, RouteLegStepData,
  RoutePlannerInputData,
  RoutePlannerResultData,
  RoutePlannerResultResponseData, WaypointData, WaypointResponseData
} from "../models";
import { RoutePlannerOptions } from "../models/interfaces/route-planner-options";

export class RoutePlannerResultConverter {

  public static convert(options: RoutePlannerOptions,
                        inputData: RoutePlannerInputData,
                        response: RoutePlannerResultResponseData): RoutePlannerResult {
    let routePlannerResultData = this.generateRoutePlannerResultData(inputData, response);
    return new RoutePlannerResult(options, routePlannerResultData);
  }

  private static generateRoutePlannerResultData(inputData: RoutePlannerInputData,
                                               response: RoutePlannerResultResponseData): RoutePlannerResultData {
    return {
      agents: this.generateAgents(response),
      // NOTE: we can generate the inputData according to RoutePlannerResultResponseData, but it will be the same object
      inputData: inputData,
      unassignedAgents: response.properties.issues?.unassigned_agents,
      unassignedJobs: response.properties.issues?.unassigned_jobs,
      unassignedShipments: response.properties.issues?.unassigned_shipments,
    }
  }

  private static generateAgents(response: RoutePlannerResultResponseData): AgentSolutionData[] {
    let result: AgentSolutionData[] = [];
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
        legs: this.generateRouteLegs(properties.legs),
        actions: this.generateActions(properties.actions),
        waypoints: this.generateWaypoints(properties.waypoints)
      })
    });
    return result;
  }

  private static generateRouteLegs(response: LegResponseData[] | undefined): RouteLegData[] {
    if(response === undefined) {
      return [];
    } else {
      return response.map((leg: LegResponseData) => {
        return {
          time: leg.time,
          distance: leg.distance,
          steps: this.generateRouteLegSteps(leg.steps),
          from_waypoint_index: leg.from_waypoint_index,
          to_waypoint_index: leg.to_waypoint_index,
        }
      });
    }
  }

  private static generateRouteLegSteps(response: LegStepResponseData[]): RouteLegStepData[] {
    return response.map((legStep: LegStepResponseData) => {
      return {
        distance: legStep.distance,
        time: legStep.distance,
        from_index: legStep.from_index,
        to_index: legStep.to_index
      }
    });
  }

  private static generateActions(response: ActionResponseData[]): RouteActionData[] {
    return response.map((action: ActionResponseData) => {
      return {
        type: action.type,
        start_time: action.start_time,
        duration: action.duration,
        shipment_index: action.shipment_index,
        shipment_id: action.shipment_id,
        location_index: action.location_index,
        location_id: action.location_id,
        job_index: action.job_index,
        job_id: action.job_id,
        index: action.index,
        waypoint_index: action.waypoint_index
      }
    });
  }

  private static generateWaypoints(response: WaypointResponseData[]): WaypointData[] {
    return response.map((waypoint: WaypointResponseData) => {
      return {
        original_location: waypoint.original_location,
        original_location_index: waypoint.original_location_index,
        original_location_id: waypoint.original_location_id,
        location: waypoint.location,
        start_time: waypoint.start_time,
        duration: waypoint.duration,
        actions: this.generateActions(waypoint.actions),
        prev_leg_index: waypoint.prev_leg_index,
        next_leg_index: waypoint.next_leg_index
      }
    });
  }
}
