describe("RoutePlanner SDK UMD export", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    delete (global as any).window;
  });

  test("should export RoutePlanner and RouteEditor properly", async () => {
    const { RoutePlanner, RouteEditor } = await import("../src/index");

    expect(RoutePlanner).toBeDefined();
    expect(RouteEditor).toBeDefined();
  });

  test("should not assign RoutePlannerSDK to window if window is undefined", async () => {
    delete (global as any).window;

    const { RoutePlanner, RouteEditor } = await import("../src/index");

    expect((global as any).window).toBeUndefined();
    expect(RoutePlanner).toBeDefined();
    expect(RouteEditor).toBeDefined();
  });

  test("should assign RoutePlannerSDK to window if window is defined", async () => {
    (global as any).window = {};

    await import("../src/index");

    expect((global as any).window.RoutePlannerSDK).toBeDefined();
    expect((global as any).window.RoutePlannerSDK.RoutePlanner).toBeDefined();
    expect((global as any).window.RoutePlannerSDK.RouteEditor).toBeDefined();
  });
});
