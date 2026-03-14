import { RoutePlannerFormatter } from "../../src/helpers/route-planner-formatter";

describe("RoutePlannerFormatter", () => {
    describe("toPrettyDistance", () => {
        test("formats values above 10000 meters with one decimal km", () => {
            expect(RoutePlannerFormatter.toPrettyDistance(15000)).toBe("15.0 km");
        });

        test("formats values above 5000 meters with two decimals km", () => {
            expect(RoutePlannerFormatter.toPrettyDistance(10000)).toBe("10.00 km");
            expect(RoutePlannerFormatter.toPrettyDistance(5001)).toBe("5.00 km");
        });

        test("formats values at or below 5000 as meters", () => {
            expect(RoutePlannerFormatter.toPrettyDistance(5000)).toBe("5000 m");
            expect(RoutePlannerFormatter.toPrettyDistance(42)).toBe("42 m");
        });
    });

    describe("toPrettyTime", () => {
        test("returns zero for zero seconds", () => {
            expect(RoutePlannerFormatter.toPrettyTime(0)).toBe("0");
        });

        test("formats minute-only values", () => {
            expect(RoutePlannerFormatter.toPrettyTime(60)).toBe("1min");
            expect(RoutePlannerFormatter.toPrettyTime(3599)).toBe("59min");
        });

        test("formats hour-only values", () => {
            expect(RoutePlannerFormatter.toPrettyTime(3600)).toBe("1h");
            expect(RoutePlannerFormatter.toPrettyTime(7200)).toBe("2h");
        });

        test("formats combined hour and minute values", () => {
            expect(RoutePlannerFormatter.toPrettyTime(3660)).toBe("1h 1m");
            expect(RoutePlannerFormatter.toPrettyTime(7260)).toBe("2h 1m");
        });
    });
});
