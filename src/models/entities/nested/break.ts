import { BreakData } from "../../interfaces";

export class Break {
    private raw: BreakData;

    constructor(raw?: BreakData) {
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
