import RoutePlanner from "../src";

describe('RoutePlanner (Real API Calls in Node.js)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.skip('should confirm Geoapify is reachable using node-fetch', async () => {
    // Temporarily remove global fetch to force node-fetch usage
    // @ts-ignore - Removing fetch to trigger node-fetch usage
    delete global.fetch;

    const result = await RoutePlanner.testConnection("api-ket");

    // Expecting success response
    expect(result).toBe("Geoapify is reachable");
  });
});
