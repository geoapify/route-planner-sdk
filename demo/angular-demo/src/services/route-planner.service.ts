import { Injectable } from '@angular/core';
import RoutePlanner, {RouteAgent, RouteJob} from '../../../../dist';

@Injectable({
  providedIn: 'root'
})
export class RoutePlannerService {
  API_KEY = '93b8e26606dd485183dcdab30f239f81'

  async makeSimpleRequest() {
    try {
      const planner = new RoutePlanner(this.API_KEY);
      return await planner
          .setMode("drive")
          .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
          .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
          .plan();
    } catch (error) {
      console.error("API test failed:", error);
      return "Error connecting to API";
    }
  }
}
