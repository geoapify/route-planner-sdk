import { Injectable } from '@angular/core';
import RoutePlanner, {Agent, Job} from '../../../..';
import TEST_API_KEY from "../../../../env-variables";
// import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";

@Injectable({
  providedIn: 'root'
})
export class RoutePlannerService {
  API_KEY = TEST_API_KEY

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
}
