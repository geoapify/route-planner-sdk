import {
  ActionResponseData,
  AgentSolutionData,
  FeatureResponseData,
  LegResponseData,
  LegStepResponseData,
  RouteActionData,
  RouteLegData,
  RouteLegStepData,
  RoutePlannerResultData,
  RoutePlannerResultResponseData,
  WaypointData,
  WaypointResponseData
} from "../src";

export class RoutePlannerResultReverseConverter {

  public static convert(data: RoutePlannerResultData): RoutePlannerResultResponseData {
    return {
      features: this.generateFeatures(data.agents),
      type: 'any',
      properties: {
        mode: 'any',
        params: data.inputData,
        issues: {
          unassigned_agents: data.unassignedAgents,
          unassigned_jobs: data.unassignedJobs,
          unassigned_shipments: data.unassignedShipments
        }
      }
    };
  }

  private static generateFeatures(agents: AgentSolutionData[]): FeatureResponseData[] {
    return agents.map(agent => ({
      properties: {
        agent_index: agent.agentIndex,
        agent_id: agent.agentId,
        time: agent.time,
        start_time: agent.start_time,
        end_time: agent.end_time,
        distance: agent.distance,
        mode: agent.mode,
        legs: this.generateLegs(agent.legs),
        actions: this.generateActions(agent.actions),
        waypoints: this.generateWaypoints(agent.waypoints)
      },
      type: "any",
      geometry: {
         type: "string",
         coordinates: []
      }
    }));
  }

  private static generateLegs(legs: RouteLegData[]): LegResponseData[] {
    return legs.map(leg => ({
      time: leg.time,
      distance: leg.distance,
      from_waypoint_index: leg.from_waypoint_index,
      to_waypoint_index: leg.to_waypoint_index,
      steps: this.generateLegSteps(leg.steps)
    }));
  }

  private static generateLegSteps(steps: RouteLegStepData[]): LegStepResponseData[] {
    return steps.map(step => ({
      distance: step.distance,
      from_index: step.from_index,
      to_index: step.to_index,
      time: 1
    }));
  }

  private static generateActions(actions: RouteActionData[]): ActionResponseData[] {
    return actions.map(action => ({
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
    }));
  }

  private static generateWaypoints(waypoints: WaypointData[]): WaypointResponseData[] {
    return waypoints.map(waypoint => ({
      original_location: waypoint.original_location,
      original_location_index: waypoint.original_location_index,
      original_location_id: waypoint.original_location_id,
      location: waypoint.location,
      start_time: waypoint.start_time,
      duration: waypoint.duration,
      prev_leg_index: waypoint.prev_leg_index,
      next_leg_index: waypoint.next_leg_index,
      actions: this.generateActions(waypoint.actions)
    }));
  }
}
