export class RoutePlanResult {
    public data: any;

    constructor(data: any) {
        this.data = data;
    }

    public getStatistics() {
        return {
            totalDistance: this.data.features?.[0]?.properties?.distance ?? 0,
            totalTime: this.data.features?.[0]?.properties?.time ?? 0
        };
    }

    public getRawData() {
        return this.data;
    }
}
