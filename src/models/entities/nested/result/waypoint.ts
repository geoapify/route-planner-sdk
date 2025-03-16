import { RouteAction } from "./route-action";
import { ActionResponseData, WaypointData } from "../../../interfaces";

export class Waypoint {
    private readonly raw: WaypointData;

    constructor(raw?: WaypointData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("WaypointData is undefined");
        }
    }

    getRaw(): WaypointData {
        return this.raw;
    }

    getOriginalLocation(): [number, number] {
        return this.raw.original_location;
    };

    getOriginalLocationIndex(): number | undefined {
        return this.raw.original_location_index;
    }

    getOriginalLocationId(): number | undefined {
        return this.raw.original_location_id;
    }

    getLocation(): [number, number] {
        return this.raw.location;
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