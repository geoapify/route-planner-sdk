import RoutePlannerSDK from "../src";

describe('RoutePlannerSDK', () => {
  test('should return a success message if Geoapify is reachable', async () => {
    const result = await RoutePlannerSDK.testConnection('api-key');
    expect(result).toBe("Geoapify is reachable");
  });
});
