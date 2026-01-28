import { AgentData } from '../../../../../models/interfaces';
import { 
    AgentMissingCapability,
    TimeWindowViolation,
    BreakViolation 
} from '../../../../../models/entities/route-editor-exceptions';

type TimeWindow = [number, number];

/**
 * Shared validation logic for both jobs and shipments.
 */
export class ConstraintValidationHelper {

    static checkCapabilities(agent: AgentData, requirements: string[], agentIndex: number): AgentMissingCapability | null {
        if (!requirements?.length) return null;
        
        const missing = requirements.filter(req => !agent.capabilities?.includes(req));
        
        if (missing.length > 0) {
            const message = missing.length === 1
                ? `Agent is missing required capability: '${missing[0]}'`
                : `Agent is missing required capabilities: ${missing.join(', ')}`;
            
            return new AgentMissingCapability(message, agentIndex, missing);
        }
        
        return null;
    }

    static checkTimeWindowOverlap(agent: AgentData, itemWindows: TimeWindow[], context: string, agentIndex: number): TimeWindowViolation | null {
        if (!agent.time_windows?.length || !itemWindows?.length) return null;
        
        if (!this.hasOverlap(agent.time_windows, itemWindows)) {
            return new TimeWindowViolation(
                `No overlap between agent and ${context} time windows`,
                agentIndex
            );
        }
        
        return null;
    }

    static checkBreakConflict(agent: AgentData, itemWindows: TimeWindow[], context: string, agentIndex: number): BreakViolation | null {
        if (!agent.breaks?.length || !itemWindows?.length) return null;
        
        if (this.allWindowsInsideBreaks(itemWindows, agent.breaks)) {
            return new BreakViolation(
                `All ${context} windows fall within agent break periods`,
                agentIndex
            );
        }
        
        return null;
    }

    private static hasOverlap(agentWindows: TimeWindow[], itemWindows: TimeWindow[]): boolean {
        for (const [aStart, aEnd] of agentWindows) {
            for (const [iStart, iEnd] of itemWindows) {
                if (iStart < aEnd && iEnd > aStart) return true;
            }
        }
        return false;
    }

    private static allWindowsInsideBreaks(windows: TimeWindow[], breaks: { time_windows: TimeWindow[] }[]): boolean {
        return windows.every(([start, end]) => 
            breaks.some(brk => 
                brk.time_windows.some(([bStart, bEnd]) => 
                    start >= bStart && end <= bEnd
                )
            )
        );
    }
}

