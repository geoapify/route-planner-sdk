import { RouteLeg } from "./route-leg";
import { AgentSolutionData } from "../../../interfaces";
import { RouteAction } from "./route-action";
import { Waypoint } from "./waypoint";

export class AgentSolution {
    private readonly raw: AgentSolutionData;

    constructor(raw?: AgentSolutionData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("AgentSolutionData is undefined");
        }
    }

    getRaw(): AgentSolutionData {
        return this.raw;
    }

    getAgentIndex(): number {
        return this.raw.agentIndex;
    }

    getAgentId(): string {
        return this.raw.agentId;
    }

    getTime(): number {
        return this.raw.time;
    }

    getStartTime(): number {
        return this.raw.start_time;
    }

    getEndTime(): number {
        return this.raw.end_time;
    }

    getDistance(): number {
        return this.raw.distance;
    }

    getMode(): string {
        return this.raw.mode;
    }

    getLegs(): RouteLeg[] {
        return this.raw.legs.map((leg) => new RouteLeg(leg));
    }

    getActions(): RouteAction[] {
        return this.raw.actions.map((action) => new RouteAction(action));
    }

    getWaypoints(): Waypoint[] {
        return this.raw.waypoints.map((waypoint) => new Waypoint(waypoint));
    }
}