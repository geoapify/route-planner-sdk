import {ActionResponseData, JobData, ShipmentData} from "../../../../models";
import { StrategyContext } from "./strategy-context";

export type LocationResolver = (context: StrategyContext, action: any) => [number, number] | null;

interface LocationPair {
    from: [number, number];
    to: [number, number];
    actionIndex: number;
}

export class RouteTimeCalculator {

    static async recalculateRouteTimes(
        context: StrategyContext, 
        agentIndex: number,
        locationResolver: LocationResolver
    ): Promise<void> {
        const agentFeature = context.getAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        const locationPairs = this.extractLocationPairs(actions, context, locationResolver);
        const travelTimes = await this.batchCalculateTravelTimes(context, locationPairs);
        const pairIndices = locationPairs.map(pair => pair.actionIndex);
        this.applyCumulativeTimes(actions, pairIndices, travelTimes);
    }

    private static extractLocationPairs(
        actions: ActionResponseData[],
        context: StrategyContext,
        locationResolver: LocationResolver
    ): LocationPair[] {
        const pairs: LocationPair[] = [];
        
        for (let i = 0; i < actions.length - 1; i++) {
            const currentLocation = locationResolver(context, actions[i]);
            const nextLocation = locationResolver(context, actions[i + 1]);
            
            if (currentLocation && nextLocation) {
                pairs.push({ from: currentLocation, to: nextLocation, actionIndex: i });
            }
        }
        
        return pairs;
    }

    private static async batchCalculateTravelTimes(
        context: StrategyContext,
        locationPairs: LocationPair[]
    ): Promise<number[]> {
        if (locationPairs.length === 0) return [];
        
        const matrixHelper = context.createMatrixHelper();
        const locations = locationPairs.map(pair => pair.from);
        locations.push(locationPairs[locationPairs.length - 1].to);
        
        return await matrixHelper.calculateConsecutiveTravelTimes(locations);
    }

    private static applyCumulativeTimes(
        actions: ActionResponseData[],
        pairIndices: number[],
        travelTimes: number[]
    ): void {
        let currentTime = 0;
        let travelTimeIndex = 0;
        
        for (let i = 0; i < actions.length; i++) {
            actions[i].start_time = currentTime;
            currentTime += actions[i].duration || 0;
            
            if (pairIndices[travelTimeIndex] === i) {
                currentTime += travelTimes[travelTimeIndex];
                travelTimeIndex++;
            }
        }
    }

    static getJobActionLocation(context: StrategyContext, action: any): [number, number] | null {
        if (action.job_index !== undefined) {
            const job: JobData = context.getRawData().properties.params.jobs[action.job_index];
            return job?.location || null;
        }
        return RouteTimeCalculator.getAgentLocation(context, action);
    }

    static getShipmentActionLocation(context: StrategyContext, action: any): [number, number] | null {
        if (action.shipment_index !== undefined) {
            const shipment: ShipmentData = context.getRawData().properties.params.shipments[action.shipment_index];
            if (action.type === 'pickup') return shipment?.pickup?.location || null;
            if (action.type === 'delivery') return shipment?.delivery?.location || null;
        }
        return RouteTimeCalculator.getAgentLocation(context, action);
    }

    private static getAgentLocation(context: StrategyContext, action: any): [number, number] | null {
        const agent = context.getRawData().properties.params.agents[action.agent_index || 0];
        if (action.type === 'start') return agent.start_location || null;
        if (action.type === 'end') return agent.end_location || null;
        return null;
    }
}

