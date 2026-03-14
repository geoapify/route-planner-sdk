import { RoutePlannerError } from "../../../src";

describe("RoutePlannerError", () => {
    test("should store error name, message, and raw response", () => {
        const rawResponse = { error: "Invalid API key", status: 401 };
        const error = new RoutePlannerError("ApiError", "Request failed", rawResponse);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("ApiError");
        expect(error.errorName).toBe("ApiError");
        expect(error.message).toBe("Request failed");
        expect(error.rawResponse).toEqual(rawResponse);
    });
});
