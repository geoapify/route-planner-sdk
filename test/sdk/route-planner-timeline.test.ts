import { RoutePlannerResult, RoutePlannerTimeline } from "../../src";

function createResult(): RoutePlannerResult {
    const raw: any = {
        type: "FeatureCollection",
        properties: {
            mode: "drive",
            params: {
                mode: "drive",
                agents: [],
                jobs: [],
                shipments: [],
                locations: []
            }
        },
        features: []
    };

    return new RoutePlannerResult(
        { apiKey: "test-key", baseUrl: "https://api.geoapify.com" },
        raw
    );
}

describe("RoutePlannerTimeline", () => {
    let generateSpy: jest.SpyInstance;
    let menuSpy: jest.SpyInstance;

    beforeEach(() => {
        generateSpy = jest
            .spyOn(RoutePlannerTimeline.prototype as any, "generateAgentTimeline")
            .mockImplementation(() => {});
        menuSpy = jest
            .spyOn(RoutePlannerTimeline.prototype as any, "initializeThreeDotMenus")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should initialize with default options and call setup methods", () => {
        const timeline = new RoutePlannerTimeline({} as HTMLElement);

        expect(timeline.getTimelineType()).toBe("time");
        expect(timeline.getShowTimelineLabels()).toBe(false);
        expect(timeline.getCapacityUnit()).toBe("items");
        expect(generateSpy).toHaveBeenCalledTimes(1);
        expect(menuSpy).toHaveBeenCalledTimes(1);
    });

    test("should call generateAgentTimeline when updating simple options", () => {
        const timeline = new RoutePlannerTimeline({} as HTMLElement);
        generateSpy.mockClear();

        timeline.setHasLargeDescription(true);
        timeline.setTimelineType("distance");
        timeline.setAgentColors(["#000000"]);
        timeline.setCapacityUnit("packages");
        timeline.setTimeLabels([{ value: 0, label: "start", position: "0%" } as any]);
        timeline.setShowTimelineLabels(true);
        timeline.setDistanceLabels([{ value: 0, label: "0", position: "0%" } as any]);
        timeline.setAgentLabel("Courier");

        expect(generateSpy).toHaveBeenCalledTimes(8);
    });

    test("should call both generateAgentTimeline and initializeThreeDotMenus for menu and result updates", () => {
        const timeline = new RoutePlannerTimeline({} as HTMLElement);
        generateSpy.mockClear();
        menuSpy.mockClear();

        timeline.setAgentMenuItems([{ key: "k", label: "L" } as any]);
        timeline.setResult(createResult());

        expect(generateSpy).toHaveBeenCalledTimes(2);
        expect(menuSpy).toHaveBeenCalledTimes(2);
        expect(timeline.getResult()).toBeDefined();
    });
});
