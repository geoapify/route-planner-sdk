import { RouteActionData } from "../../../interfaces";

export class RouteAction {
    private readonly raw: RouteActionData;

    constructor(raw?: RouteActionData) {
        if (raw) {
            this.raw = raw;
        } else {
            throw new Error("RouteActionData is undefined");
        }
    }

    getRaw(): RouteActionData {
        return this.raw;
    }

    getType(): string {
        return this.raw.type;
    }
    getStartTime(): number {
        return this.raw.start_time;
    }
    getDuration(): number {
        return this.raw.duration;
    }
    getShipmentIndex(): number | undefined {
        return this.raw.shipment_index;
    }
    getShipmentId(): string | undefined {
        return this.raw.shipment_id;
    }
    getLocationIndex(): number | undefined {
        return this.raw.location_index;
    }
    getLocationId(): string | undefined {
        return this.raw.location_id;
    }
    getJobIndex(): number | undefined {
        return this.raw.job_index;
    }
    getJobId(): string | undefined {
        return this.raw.job_id;
    }
    getIndex(): number | undefined {
        return this.raw.index;
    }
    getWaypointIndex(): number | undefined {
        return this.raw.waypoint_index;
    }
}