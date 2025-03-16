import { Job, JobData } from "../../../../../src";

describe("Job", () => {
    let job: Job;
    let initialData: JobData;

    beforeEach(() => {
        initialData = {
            id: "J1",
            description: "Test Job",
            location: [40.712776, -74.005974],
            location_index: 1,
            priority: 5,
            duration: 300,
            pickup_amount: 10,
            delivery_amount: 20,
            requirements: ["cold_storage"],
            time_windows: [[1609459200, 1609462800]]
        };

        job = new Job(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultJob = new Job();
        expect(defaultJob.getRaw()).toEqual({
            requirements: [],
            time_windows: [],
        });
    });

    test("should return the raw data", () => {
        expect(job.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: JobData = { ...initialData, id: "J2", description: "Updated Job" };
        job.setRaw(newData);
        expect(job.getRaw()).toEqual(newData);
    });

    test("should set location", () => {
        job.setLocation(10.0, 20.0);
        expect(job.getRaw().location).toEqual([10.0, 20.0]);
    });

    test("should set location index", () => {
        job.setLocationIndex(5);
        expect(job.getRaw().location_index).toBe(5);
    });

    test("should set priority", () => {
        job.setPriority(10);
        expect(job.getRaw().priority).toBe(10);
    });

    test("should set duration", () => {
        job.setDuration(600);
        expect(job.getRaw().duration).toBe(600);
    });

    test("should set pickup amount", () => {
        job.setPickupAmount(50);
        expect(job.getRaw().pickup_amount).toBe(50);
    });

    test("should set delivery amount", () => {
        job.setDeliveryAmount(75);
        expect(job.getRaw().delivery_amount).toBe(75);
    });

    test("should add requirement", () => {
        job.addRequirement("hazmat");
        expect(job.getRaw().requirements).toContain("hazmat");
    });

    test("should add a time window", () => {
        job.addTimeWindow(1609466400, 1609470000);
        expect(job.getRaw().time_windows).toContainEqual([1609466400, 1609470000]);
    });

    test("should set ID", () => {
        job.setId("J2");
        expect(job.getRaw().id).toBe("J2");
    });

    test("should set description", () => {
        job.setDescription("Updated Description");
        expect(job.getRaw().description).toBe("Updated Description");
    });
});
