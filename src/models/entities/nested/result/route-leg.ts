import { RouteLegStep } from "./route-leg-step";
import { LegResponseData, LegStepResponseData } from "../../../interfaces";

export class RouteLeg {
    private readonly raw: LegResponseData;

    constructor(raw?: LegResponseData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("LegResponseData is undefined");
        }
    }

    getRaw(): LegResponseData {
        return this.raw;
    }

    getTime(): number {
        return this.raw.time;
    }

    getDistance(): number {
        return this.raw.distance;
    }

    getSteps(): RouteLegStep[] {
        return this.raw.steps.map((step: LegStepResponseData) => new RouteLegStep(step));
    }

    getFromWaypointIndex(): number {
        return this.raw.from_waypoint_index;
    }

    getToWaypointIndex(): number {
        return this.raw.to_waypoint_index;
    }
}
