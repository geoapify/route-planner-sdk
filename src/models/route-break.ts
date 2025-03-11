export class RouteBreak {
    public duration?: number;
    public time_windows: [number, number][] = [];

    public addTimeWindow(start: number, end: number): this {
        this.time_windows.push([start, end]);
        return this;
    }

    public setDuration(duration: number): this {
        this.duration = duration;
        return this;
    }
}
