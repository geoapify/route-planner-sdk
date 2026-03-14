import { IndexConverter } from "../../src/helpers/index-converter";
import { AgentNotFound, JobNotFound, ShipmentNotFound } from "../../src/models/entities/route-editor-exceptions";

describe("IndexConverter", () => {
    const data: any = {
        properties: {
            params: {
                agents: [{ id: "agent-A" }, { id: "agent-B" }],
                jobs: [{ id: "job-1" }, { id: "job-2" }],
                shipments: [{ id: "shipment-1" }, { id: "shipment-2" }],
            },
        },
    };

    describe("convertAgentToIndex", () => {
        test("returns numeric value as is", () => {
            expect(IndexConverter.convertAgentToIndex(data, 1)).toBe(1);
        });

        test("converts agent id to index", () => {
            expect(IndexConverter.convertAgentToIndex(data, "agent-B")).toBe(1);
        });

        test("returns -1 when agent is not found and throw flag is false", () => {
            expect(IndexConverter.convertAgentToIndex(data, "agent-Z")).toBe(-1);
        });

        test("throws AgentNotFound when agent is not found and throw flag is true", () => {
            expect(() => IndexConverter.convertAgentToIndex(data, "agent-Z", true)).toThrow(AgentNotFound);
        });
    });

    describe("convertJobToIndex", () => {
        test("returns numeric value as is", () => {
            expect(IndexConverter.convertJobToIndex(data, 0)).toBe(0);
        });

        test("converts job id to index", () => {
            expect(IndexConverter.convertJobToIndex(data, "job-2")).toBe(1);
        });

        test("returns -1 for missing job", () => {
            expect(IndexConverter.convertJobToIndex(data, "job-Z")).toBe(-1);
        });
    });

    describe("convertShipmentToIndex", () => {
        test("returns numeric value as is", () => {
            expect(IndexConverter.convertShipmentToIndex(data, 0)).toBe(0);
        });

        test("converts shipment id to index", () => {
            expect(IndexConverter.convertShipmentToIndex(data, "shipment-2")).toBe(1);
        });

        test("returns -1 for missing shipment", () => {
            expect(IndexConverter.convertShipmentToIndex(data, "shipment-Z")).toBe(-1);
        });
    });

    describe("convertJobsToIndexes", () => {
        test("returns numeric array as is", () => {
            expect(IndexConverter.convertJobsToIndexes(data, [1, 0])).toEqual([1, 0]);
        });

        test("converts job ids to indexes", () => {
            expect(IndexConverter.convertJobsToIndexes(data, ["job-2", "job-1"])).toEqual([1, 0]);
        });

        test("throws JobNotFound for unknown job id", () => {
            expect(() => IndexConverter.convertJobsToIndexes(data, ["job-1", "job-Z"])).toThrow(JobNotFound);
        });
    });

    describe("convertShipmentsToIndexes", () => {
        test("returns numeric array as is", () => {
            expect(IndexConverter.convertShipmentsToIndexes(data, [1, 0])).toEqual([1, 0]);
        });

        test("converts shipment ids to indexes", () => {
            expect(IndexConverter.convertShipmentsToIndexes(data, ["shipment-2", "shipment-1"])).toEqual([1, 0]);
        });

        test("throws ShipmentNotFound for unknown shipment id", () => {
            expect(() => IndexConverter.convertShipmentsToIndexes(data, ["shipment-1", "shipment-Z"])).toThrow(ShipmentNotFound);
        });
    });
});
