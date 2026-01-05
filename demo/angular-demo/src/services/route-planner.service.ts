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

  /**
   * Assign jobs to a different agent using the editor
   */
  async assignJobs(
    result: RoutePlannerResult, 
    targetAgentIdOrIndex: string | number, 
    jobIds: string[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignJobs(targetAgentIdOrIndex, jobIds, options);
      return {
        success,
        message: success 
          ? `Jobs [${jobIds.join(', ')}] assigned to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
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
    shipmentIds: string[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignShipments(targetAgentIdOrIndex, shipmentIds, options);
      return {
        success,
        message: success 
          ? `Shipments [${shipmentIds.join(', ')}] assigned to agent ${targetAgentIdOrIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
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
    jobIds: string[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeJobs(jobIds, options);
      return {
        success,
        message: success 
          ? `Jobs [${jobIds.join(', ')}] removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
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
    shipmentIds: string[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeShipments(shipmentIds, options);
      return {
        success,
        message: success 
          ? `Shipments [${shipmentIds.join(', ')}] removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
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
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Create a sample Job for testing
   */
  createSampleJob(id: string, lon: number, lat: number, duration: number = 300): Job {
    return new Job()
      .setId(id)
      .setLocation(lon, lat)
      .setDuration(duration);
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
