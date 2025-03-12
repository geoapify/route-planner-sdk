import { BreakData } from "../../interfaces";
import { BaseSerializable } from "../../base-serializable";

export class Break extends BaseSerializable {
    private raw: BreakData;

    constructor(raw?: BreakData) {
        super();
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {
                time_windows: []
            };
        }
    }

    getRaw(): BreakData {
        return this.raw;
    }

    setRaw(value: BreakData) {
        this.raw = value;
    }

    public addTimeWindow(start: number, end: number): this {
        this.raw.time_windows.push([start, end]);
        return this;
    }

    public setDuration(duration: number): this {
        this.raw.duration = duration;
        return this;
    }
}
