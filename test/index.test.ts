import { RoutePlannerSDK } from '../src/index';

describe("RoutePlannerSDK", () => {
  it("should instantiate with API key", () => {
    const sdk = new RoutePlannerSDK("test-key");
    expect(sdk).toBeDefined();
  });
});
