import { RouteLegStep } from "./route-leg-step";
import { RouteLegData, RouteLegStepData } from "../../../interfaces";

export class RouteLeg {
    private readonly raw: RouteLegData;

    constructor(raw?: RouteLegData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("RouteLegData is undefined");
        }
    }

    getRaw(): RouteLegData {
        return this.raw;
    }

    getTime(): number {
        return this.raw.time;
    }

    getDistance(): number {
        return this.raw.distance;
    }

    getSteps(): RouteLegStep[] {
        return this.raw.steps.map((step: RouteLegStepData) => new RouteLegStep(step));
    }

    getFromWaypointIndex(): number {
        return this.raw.from_waypoint_index;
    }

    getToWaypointIndex(): number {
        return this.raw.to_waypoint_index;
    }
}