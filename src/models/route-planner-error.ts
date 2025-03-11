export class RoutePlannerError extends Error {
    constructor(public errorName: string, message: string) {
        super(message);
        this.name = errorName;
    }
}
