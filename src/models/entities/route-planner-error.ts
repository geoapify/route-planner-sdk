export class RoutePlannerError extends Error {
    constructor(public errorName: string, public message: string, public rawResponse: any) {
        super(message);
        this.name = errorName;
        this.rawResponse = rawResponse;
    }
}
