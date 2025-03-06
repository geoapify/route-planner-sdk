import RoutePlannerSDK from "../src";
import { RouteJob } from "../src/models/route-job";
import { RouteAgent } from "../src/models/route-agent";

describe('RoutePlannerSDK', () => {
  test('should return a success message if Geoapify is reachable', async () => {
    const result = await RoutePlannerSDK.testConnection('api-key');
    expect(result).toBe("Geoapify is reachable");
  });

  test('should return success for basic request to Route Planner API', async () => {
    const planner = new RoutePlannerSDK("93b8e26606dd485183dcdab30f239f81");

    const result = await planner
        .setMode("drive")
        .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
        .plan();

    expect(result).toBeDefined();
  });

  test('should return issue object for invalid request to Route Planner API', async () => {
    const planner = new RoutePlannerSDK("93b8e26606dd485183dcdab30f239f81");

    const result = await planner
        .setMode("drive")
        .plan();

    expect(result).toBeDefined();
  });
});
