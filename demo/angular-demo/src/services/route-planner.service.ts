import { Injectable } from '@angular/core';
import RoutePlannerSDK from '../../../../dist';

@Injectable({
  providedIn: 'root'
})
export class RoutePlannerService {
  private planner = new RoutePlannerSDK("YOUR_API_KEY"); // Initialize the SDK

  async testConnection(): Promise<string> {
    try {
      return await RoutePlannerSDK.testConnection("YOUR_API_KEY");
    } catch (error) {
      console.error("API test failed:", error);
      return "Error connecting to API";
    }
  }
}
