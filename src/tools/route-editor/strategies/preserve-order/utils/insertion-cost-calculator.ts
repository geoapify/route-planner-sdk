import { RouteResultEditorBase } from "../../../route-result-editor-base";

/**
 * Calculates optimal insertion points for new locations in existing routes.
 * Uses existing leg data when available, otherwise calls Routing API.
 */
export class InsertionCostCalculator {

    static async findOptimalInsertionPoint(context: RouteResultEditorBase, agentIndex: number,
                                           route: [number, number][], newLocation: [number, number],
                                           canReuseExistingTimes: boolean = true): Promise<number> {
        if (route.length === 0) {
            return 0;
        }
        if (route.length === 1) {
            return 1;
        }

        const matrixHelper = context.getMatrixHelper();
        const consecutiveTimes = await this.getConsecutiveTimes(context, agentIndex, route, canReuseExistingTimes);

        const [timesToNew, timesFromNew] = await Promise.all([
            matrixHelper.calculateTimesToLocation(route, newLocation),
            matrixHelper.calculateTimesFromLocation(newLocation, route)
        ]);

        const costs: number[] = [];
        for (let i = 0; i < timesToNew.length; i++) {
            if (i === timesToNew.length - 1) {
                costs.push(timesToNew[i]);
            } else {
                costs.push(timesToNew[i] + timesFromNew[i + 1] - consecutiveTimes[i]);
            }
        }

        const minCost = Math.min(...costs);
        return costs.indexOf(minCost) + 1;
    }

    private static async getConsecutiveTimes(context: RouteResultEditorBase, agentIndex: number,
                                             route: [number, number][], canReuseExistingTimes: boolean): Promise<number[]> {
        if (canReuseExistingTimes) {
            const existingTimes = context.getExistingConsecutiveTravelTimes(agentIndex);
            if (existingTimes.length === route.length - 1) {
                return existingTimes;
            }
        }

        const routingHelper = context.getRoutingHelper();
        return routingHelper.calculateConsecutiveTravelTimes(route);
    }
}

