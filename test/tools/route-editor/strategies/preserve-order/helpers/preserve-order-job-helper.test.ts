import { PreserveOrderJobHelper } from "../../../../../../src/tools/route-editor/strategies/preserve-order/helpers/preserve-order-job-helper";
import { InsertionCostCalculator } from "../../../../../../src/tools/route-editor/strategies/preserve-order/utils/insertion-cost-calculator";

function buildContext(route: [number, number][]) {
    const rawData = {
        properties: {
            params: {
                agents: [{
                    start_location: route[0],
                    end_location: route[route.length - 1]
                }],
                jobs: [{
                    location: [50, 50] as [number, number]
                }]
            }
        }
    };

    return {
        getRawData: () => rawData,
        getAgentFeature: () => ({
            properties: {
                waypoints: route.map((location) => ({ original_location: location }))
            }
        })
    } as any;
}

describe("PreserveOrderJobHelper", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("findOptimalInsertPosition passes correct boundary flags for agents with start/end", async () => {
        const context = buildContext([[0, 0], [1, 1], [2, 2]]);

        jest.spyOn(PreserveOrderJobHelper as any, "calculateTravelTimes").mockResolvedValue([]);
        const insertionSpy = jest
            .spyOn(InsertionCostCalculator, "findOptimalInsertionPoint")
            .mockResolvedValue(1);

        await PreserveOrderJobHelper.findOptimalInsertPosition(context, 0, 0);

        const options = insertionSpy.mock.calls[0][4] as any;
        expect(options.canInsertBeforeFirst).toBe(false);
        expect(options.canInsertAfterLast).toBe(false);
    });

    test("findOptimalInsertPositionAfter maps position correctly for afterWaypointIndex=0", async () => {
        const context = buildContext([[0, 0], [1, 1], [2, 2]]);

        jest.spyOn(PreserveOrderJobHelper as any, "calculateTravelTimes").mockResolvedValue([]);
        const insertionSpy = jest
            .spyOn(InsertionCostCalculator, "findOptimalInsertionPoint")
            .mockResolvedValue(1);

        const position = await PreserveOrderJobHelper.findOptimalInsertPositionAfter(context, 0, 0, 0);

        expect(position).toBe(1);
        expect(insertionSpy.mock.calls[0][2]).toEqual([[0, 0], [1, 1], [2, 2]]);
        const options = insertionSpy.mock.calls[0][4] as any;
        expect(options.canInsertAfterLast).toBe(false);
    });
});
