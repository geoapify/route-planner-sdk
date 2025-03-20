import { RoutePlannerResult } from "./models/entities/route-planner-result";
import {
  AgentSolution,
  AgentSolutionData,
  RouteActionInfo,
  RoutePlannerInputData,
} from "./models";
import { Utils } from "./tools/utils";
import { RoutePlanner } from "./route-planner";

export class RoutePlannerResultEditor {
  private readonly result: RoutePlannerResult;

  constructor(result: RoutePlannerResult) {
    this.result = result;
  }

  public getRoutePlannerResult(): RoutePlannerResult {
    return this.result;
  }

  /**
   * Assigns a job to an agent. Removes the job if it's currently assigned to another agent
   * @param agentId - The ID of the agent.
   * @param jobIds
   * @returns {boolean} - Returns true if the job was successfully assigned.
   */
  async assignJobs(agentId: string, jobIds: string[]): Promise<boolean> {
    this.validateAgent(agentId);
    this.validateJobs(jobIds);
    for (const jobId of jobIds) {
      let jobInfo = this.result.getJobInfo(jobId)!;

      let newAgent = this.result.getAgentSolution(agentId)!;
      await this.removeJobFromAgentIfAssigned(jobInfo);

      let agentSolutionDataToOptimize2 =  this.addJobToAgent(newAgent, jobInfo);
      let optimizedAgent2 = await this.optimizeRoute(agentSolutionDataToOptimize2);
      this.replaceAgent(newAgent, optimizedAgent2);
    }
    return true;
  }

  private async removeJobFromAgentIfAssigned(jobInfo: RouteActionInfo) {
    if (jobInfo != undefined) {
      let currentAgent = this.result.getAgentSolution(jobInfo.getAgentId())!;
      let agentSolutionDataToOptimize1 = this.removeJobFromAgent(currentAgent, jobInfo);
      let optimizedAgent1 = await this.optimizeRoute(agentSolutionDataToOptimize1);
      this.replaceAgent(currentAgent, optimizedAgent1);
    }
  }

  private addJobToAgent(newAgent: AgentSolution, jobInfo: RouteActionInfo) {
    let newAgentSolutionData: AgentSolutionData = Utils.cloneObject(newAgent.getRaw());
    newAgentSolutionData.actions.push(jobInfo.getRaw().action.getRaw());
    return newAgentSolutionData;
  }

  private removeJobFromAgent(currentAgent: AgentSolution, jobInfo: RouteActionInfo) {
    let newAgentSolutionData: AgentSolutionData = Utils.cloneObject(currentAgent.getRaw());
    newAgentSolutionData.actions =
        newAgentSolutionData.actions.filter(action => action.job_id != jobInfo?.getRaw().action.getJobId());
    return newAgentSolutionData;
  }

  async optimizeRoute(agentToOptimize: AgentSolutionData): Promise<AgentSolutionData> {
    let agentJobs = new Set(
        agentToOptimize.actions
            .filter(action => action.job_id !== undefined)
            .map(action => action.job_id)
    );
    let agentShipments = new Set(
        agentToOptimize.actions
            .filter(action => action.shipment_id !== undefined)
            .map(action => action.shipment_id)
    );
    let agentLocations = new Set(
        agentToOptimize.actions
            .filter(action => action.location_id !== undefined)
            .map(action => action.location_id)
    );
    let newRawData: RoutePlannerInputData = Utils.cloneObject(this.result.getRaw().inputData);

    newRawData.agents = newRawData.agents.filter(nextAgent => nextAgent.id == agentToOptimize.agentId);
    newRawData.jobs = newRawData.jobs.filter(nextJob => agentJobs.has(nextJob.id));
    newRawData.shipments = newRawData.shipments.filter(nextShipment => agentShipments.has(nextShipment.id));
    newRawData.locations = newRawData.locations.filter(nextLocation => agentLocations.has(nextLocation.id));

    const planner = new RoutePlanner(this.result.getOptions(), newRawData);
    let plannerResult = await planner.plan();
    let optimizedAgent = plannerResult.getAgentSolution(agentToOptimize.agentId);
    if(optimizedAgent === undefined) {
      throw new Error("Something went wrong during optimization");
    }
    return optimizedAgent.getRaw();
  }

  replaceAgent(agentToReplace: AgentSolution, agentToReplaceWith: AgentSolutionData) {
    this.result.getRaw().agents =
        this.result.getRaw().agents.map(agent => agent.agentId == agentToReplace.getAgentId() ? agentToReplaceWith : agent);
  }

  validateAgent(agentId: string) {
    if(this.result.getAgentSolution(agentId) == undefined) {
      throw new Error(`Agent with id ${agentId} not found`);
    }
  }

  validateJobs(jobIds: string[]) {
    jobIds.forEach((jobId) => {
      if(this.result.getJobInfo(jobId) == undefined) {
        throw new Error(`Job with id ${jobId} not found`);
      }
    });
  }
}
