import { RouteLegStepData } from "../../../interfaces";

export class RouteLegStep {
    private readonly raw: RouteLegStepData;

    constructor(raw?: RouteLegStepData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("RouteLegStepData is undefined");
        }
    }

    getRaw(): RouteLegStepData {
        return this.raw;
    }

    getDistance(): number {
        return this.raw.distance;
    }

    getTime(): number {
        return this.raw.time;
    }

    getFromIndex(): number {
        return this.raw.from_index;
    }

    getToIndex(): number {
        return this.raw.to_index;
    }
}