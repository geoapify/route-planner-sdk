import { InsertionCostCalculator, InsertionTravelTimes } from "../../../../../../src/tools/route-editor/strategies/preserve-order/utils/insertion-cost-calculator";

function buildContext(route: [number, number][]) {
    return {
        getAgentFeature: () => ({
            properties: {
                legs: [],
                waypoints: route.map((location) => ({ original_location: location }))
            }
        }),
        getRoutingHelper: () => ({
            calculateConsecutiveTravelTimes: jest.fn()
        })
    } as any;
}

function tt(from: [number, number], to: [number, number], time: number) {
    return { locationFrom: from, locationTo: to, time };
}

describe("InsertionCostCalculator", () => {
    test("respects canInsertBeforeFirst=false", async () => {
        const route: [number, number][] = [[0, 0], [1, 0], [2, 0]];
        const newLocation: [number, number] = [0, 1];
        const context = buildContext(route);

        const travelTimes: InsertionTravelTimes = [
            tt(route[0], newLocation, 1),
            tt(newLocation, route[0], 1),
            tt(route[1], newLocation, 100),
            tt(newLocation, route[1], 100),
            tt(route[2], newLocation, 100),
            tt(newLocation, route[2], 100),
            tt(route[0], route[1], 0),
            tt(route[1], route[2], 0)
        ];

        const unrestricted = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            0,
            route,
            newLocation,
            { canInsertBeforeFirst: true, canInsertAfterLast: false, travelTimes }
        );
        expect(unrestricted).toBe(0);

        const restricted = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            0,
            route,
            newLocation,
            { canInsertBeforeFirst: false, canInsertAfterLast: false, travelTimes }
        );
        expect(restricted).toBe(1);
    });

    test("respects canInsertAfterLast=false", async () => {
        const route: [number, number][] = [[0, 0], [1, 0], [2, 0]];
        const newLocation: [number, number] = [3, 0];
        const context = buildContext(route);

        const travelTimes: InsertionTravelTimes = [
            tt(route[0], newLocation, 200),
            tt(newLocation, route[0], 200),
            tt(route[1], newLocation, 200),
            tt(newLocation, route[1], 200),
            tt(route[2], newLocation, 1),
            tt(newLocation, route[2], 1),
            tt(route[0], route[1], 0),
            tt(route[1], route[2], 0)
        ];

        const unrestricted = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            0,
            route,
            newLocation,
            { canInsertBeforeFirst: false, canInsertAfterLast: true, travelTimes }
        );
        expect(unrestricted).toBe(3);

        const restricted = await InsertionCostCalculator.findOptimalInsertionPoint(
            context,
            0,
            route,
            newLocation,
            { canInsertBeforeFirst: false, canInsertAfterLast: false, travelTimes }
        );
        expect(restricted).toBe(2);
    });
});
