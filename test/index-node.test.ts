import { RoutePlannerSDK } from "../src";

describe('RoutePlannerSDK (Real API Calls in Node.js)', () => {
  let sdk: RoutePlannerSDK;
  const originalFetch = global.fetch;

  beforeAll(() => {
    sdk = new RoutePlannerSDK('dummy-api-key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.skip('should confirm Geoapify is reachable using node-fetch', async () => {
    // Temporarily remove global fetch to force node-fetch usage
    // @ts-ignore - Removing fetch to trigger node-fetch usage
    delete global.fetch;

    const result = await sdk.testMethod();

    // Expecting success response
    expect(result).toBe("Geoapify is reachable");
  });
});
