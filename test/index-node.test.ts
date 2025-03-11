import RoutePlanner, { RouteLocation } from "../src";

describe('RoutePlanner (Real API Calls in Node.js)', () => {
  const originalFetch = global.fetch;
  const API_KEY = "API_KEY";

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.skip('should confirm Geoapify is reachable using node-fetch', async () => {
    // Temporarily remove global fetch to force node-fetch usage
    // @ts-ignore - Removing fetch to trigger node-fetch usage
    delete global.fetch;

    let planner = new RoutePlanner(API_KEY);
    planner.addLocation(new RouteLocation().setId('1'));
    expect(planner.locations.length).toBe(1);
  });
});
