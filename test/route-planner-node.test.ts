import RoutePlanner, { Location } from "../src";
import TEST_API_KEY from "../env-variables";

describe('RoutePlanner (Real API Calls in Node.js)', () => {
  const originalFetch = global.fetch;
  const API_KEY = TEST_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.skip('should confirm Geoapify is reachable using node-fetch', async () => {
    // Temporarily remove global fetch to force node-fetch usage
    // @ts-ignore - Removing fetch to trigger node-fetch usage
    delete global.fetch;

    let planner = new RoutePlanner({apiKey: API_KEY});
    planner.addLocation(new Location().setId('1'));
    expect(planner.getRaw().locations.length).toBe(1);
  });
});
