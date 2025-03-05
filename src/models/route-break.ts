export class RouteBreak {
    public duration?: number;
    public time_windows: [number, number][] = [];

    public addTimeWindow(lon: number, lat: number): this {
        this.time_windows.push([lon, lat]);
        return this;
    }

    public setDuration(duration: number): this {
        this.duration = duration;
        return this;
    }
}
