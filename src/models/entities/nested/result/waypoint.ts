import { RouteAction } from "./route-action";
import { ActionResponseData, WaypointResponseData } from "../../../interfaces";

export class Waypoint {
    private readonly raw: WaypointResponseData;

    constructor(raw?: WaypointResponseData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("WaypointData is undefined");
        }
    }

    getRaw(): WaypointResponseData {
        return this.raw;
    }

    getOriginalLocation(): [number, number] {
        return this.raw.original_location;
    };

    getOriginalLocationIndex(): number | undefined {
        return this.raw.original_location_index;
    }

    getOriginalLocationId(): string | undefined {
        return this.raw.original_location_id;
    }

    getLocation(): [number, number] {
        return this.raw.location || this.raw.original_location;
    }

    getStartTime(): number {
        return this.raw.start_time;
    }

    getDuration(): number {
        return this.raw.duration;
    }

    getActions(): RouteAction[] {
        return this.raw.actions.map((action: ActionResponseData) => new RouteAction(action));
    }

    getPrevLegIndex(): number | undefined {
        return this.raw.prev_leg_index;
    }

    getNextLegIndex(): number | undefined {
        return this.raw.next_leg_index;
    }
}
