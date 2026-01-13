import { Injectable } from '@angular/core';
import RoutePlanner, { 
  Agent,
  Job,
  Shipment,
  ShipmentStep,
  RoutePlannerInputData, 
  RoutePlannerResult,
  RoutePlannerResultEditor,
  AddAssignOptions,
  RemoveOptions
} from '../../../../src';
import { ScenarioHelper } from './scenario-helper';
import TEST_API_KEY from "../../../../env-variables";

export interface EditorOperationResult {
  success: boolean;
  message: string;
  result?: RoutePlannerResult;
}

@Injectable({
  providedIn: 'root'
})
export class RoutePlannerService {
  API_KEY = TEST_API_KEY;

  async makeSimpleRequest() {
    try {
      const planner = new RoutePlanner({apiKey: this.API_KEY});
      return await planner
          .setMode("drive")
          .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
          .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
          .plan();
    } catch (error) {
      console.error("API test failed:", error);
      return "Error connecting to API";
    }
  }

  async planRoute(rawData: RoutePlannerInputData): Promise<RoutePlannerResult | string> {
    try {
      const planner = new RoutePlanner({apiKey: this.API_KEY});
      return await planner
          .setRaw(rawData)
          .plan();
    } catch (error) {
      console.error("API test failed:", error);
      return "Error connecting to API";
    }
  }

  async createValidationTestScenario(): Promise<RoutePlannerResult | string> {
    return ScenarioHelper.createValidationScenario(this.API_KEY);
  }

  /**
   * Assign jobs to a different agent using the editor
   */
  async assignJobs(
    result: RoutePlannerResult, 
    targetAgentIdOrIndex: string | number, 
    jobIndexes: number[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignJobs(targetAgentIdOrIndex, jobIndexes, options);
      return {
        success,
        message: success 
          ? `${jobIndexes.length} job(s) assigned to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[assignJobs] Operation failed');
      console.error('[assignJobs] Error:', error);
      console.error('[assignJobs] Stack:', error.stack);
      console.error('[assignJobs] Target agent:', targetAgentIdOrIndex);
      console.error('[assignJobs] Job indexes:', jobIndexes);
      console.error('[assignJobs] Options:', options);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Assign shipments to a different agent using the editor
   */
  async assignShipments(
    result: RoutePlannerResult, 
    targetAgentIdOrIndex: string | number, 
    shipmentIndexes: number[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignShipments(targetAgentIdOrIndex, shipmentIndexes, options);
      return {
        success,
        message: success 
          ? `${shipmentIndexes.length} shipment(s) assigned to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('assignJobs failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Remove jobs from the plan
   */
  async removeJobs(
    result: RoutePlannerResult, 
    jobIndexes: number[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeJobs(jobIndexes, options);
      return {
        success,
        message: success 
          ? `${jobIndexes.length} job(s) removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[removeJobs] Operation failed');
      console.error('[removeJobs] Error:', error);
      console.error('[removeJobs] Stack:', error.stack);
      console.error('[removeJobs] Job indexes:', jobIndexes);
      console.error('[removeJobs] Options:', options);
      console.error('[removeJobs] Result data:', result.getRawData());
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Remove shipments from the plan
   */
  async removeShipments(
    result: RoutePlannerResult, 
    shipmentIndexes: number[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeShipments(shipmentIndexes, options);
      return {
        success,
        message: success 
          ? `${shipmentIndexes.length} shipment(s) removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[removeShipments] Operation failed');
      console.error('[removeShipments] Error:', error);
      console.error('[removeShipments] Stack:', error.stack);
      console.error('[removeShipments] Shipment indexes:', shipmentIndexes);
      console.error('[removeShipments] Options:', options);
      console.error('[removeShipments] Result data:', result.getRawData());
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add new jobs to an agent's plan
   */
  async addNewJobs(
    result: RoutePlannerResult, 
    targetAgentIdOrIndex: string | number, 
    jobs: Job[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewJobs(targetAgentIdOrIndex, jobs, options);
      return {
        success,
        message: success 
          ? `${jobs.length} new job(s) added to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Adding jobs failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('assignJobs failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add new shipments to an agent's plan
   */
  async addNewShipments(
    result: RoutePlannerResult, 
    targetAgentIdOrIndex: string | number, 
    shipments: Shipment[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewShipments(targetAgentIdOrIndex, shipments, options);
      return {
        success,
        message: success 
          ? `${shipments.length} new shipment(s) added to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Adding shipments failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('assignJobs failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add a new job with validation support
   */
  async addNewJob(
    result: RoutePlannerResult,
    targetAgentIdOrIndex: string | number,
    jobData: {
      id: string;
      lon: number;
      lat: number;
      pickupAmount?: number;
      deliveryAmount?: number;
      requirements?: string[];
      timeWindowStart?: number | null;
      timeWindowEnd?: number | null;
    },
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const job = new Job()
        .setId(jobData.id)
        .setLocation(jobData.lon, jobData.lat)
        .setDuration(300);

      if (jobData.pickupAmount) job.setPickupAmount(jobData.pickupAmount);
      if (jobData.deliveryAmount) job.setDeliveryAmount(jobData.deliveryAmount);
      if (jobData.requirements) {
        jobData.requirements.forEach(req => job.addRequirement(req));
      }
      if (jobData.timeWindowStart !== null && jobData.timeWindowStart !== undefined && 
          jobData.timeWindowEnd !== null && jobData.timeWindowEnd !== undefined) {
        job.addTimeWindow(jobData.timeWindowStart, jobData.timeWindowEnd);
      }

      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewJobs(targetAgentIdOrIndex, [job], options);
      
      return {
        success,
        message: success 
          ? `Job ${jobData.id} added to agent ${targetAgentIdOrIndex}` 
          : 'Adding job failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('assignJobs failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Create a sample Shipment for testing
   */
  createSampleShipment(
    id: string, 
    pickupLon: number, 
    pickupLat: number, 
    deliveryLon: number, 
    deliveryLat: number,
    pickupDuration: number = 120,
    deliveryDuration: number = 120
  ): Shipment {
    return new Shipment()
      .setId(id)
      .setPickup(
        new ShipmentStep()
          .setLocation(pickupLon, pickupLat)
          .setDuration(pickupDuration)
      )
      .setDelivery(
        new ShipmentStep()
          .setLocation(deliveryLon, deliveryLat)
          .setDuration(deliveryDuration)
      );
  }
}
