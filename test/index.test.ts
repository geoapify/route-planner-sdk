import { RoutePlannerSDK } from "../src";

describe('RoutePlannerSDK', () => {
  let sdk: RoutePlannerSDK;

  beforeAll(() => {
    sdk = new RoutePlannerSDK('dummy-api-key');
  });

  test('should return a success message if Geoapify is reachable', async () => {
    const result = await sdk.testMethod();
    expect(result).toBe("Geoapify is reachable");
  });
});
