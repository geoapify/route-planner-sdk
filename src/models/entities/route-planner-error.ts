export class RoutePlannerError extends Error {
    constructor(public errorName: string, override message: string, public rawResponse: any) {
        super(message);
        this.name = errorName;
        this.rawResponse = rawResponse;
    }
}
