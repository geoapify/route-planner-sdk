import {
    AgentData,
    AgentPlan,
    AgentPlanData,
    JobData,
    RouteAction,
    RoutingOptions
} from "../../../../../src";
import { JobPlan } from "../../../../../src/models/entities/nested/result/job-plan";
import { RoutePlannerCallOptions } from "../../../../../src/models/interfaces/route-planner-call-options";

describe("JobPlan", () => {
    const agentInputData: AgentData = {
        start_location: [10, 20],
        capabilities: [],
        breaks: [],
        time_windows: []
    };

    const routingOptions: RoutingOptions = {
        mode: "drive"
    };

    const callOptions: RoutePlannerCallOptions = {
        apiKey: "test-key",
        baseUrl: "https://api.geoapify.com"
    };

    const agentPlanData: AgentPlanData = {
        agent_index: 2,
        agent_id: "agent-2",
        time: 100,
        start_time: 0,
        end_time: 100,
        distance: 1200,
        mode: "drive",
        legs: [],
        actions: [
            { type: "job", start_time: 10, duration: 5, job_index: 1, job_id: "job-1", index: 0, waypoint_index: 0 },
            { type: "pickup", start_time: 20, duration: 5, shipment_index: 3, shipment_id: "shipment-3", index: 1, waypoint_index: 1 },
            { type: "job", start_time: 30, duration: 5, job_index: 1, job_id: "job-1", index: 2, waypoint_index: 2 },
            { type: "job", start_time: 40, duration: 5, job_index: 7, job_id: "job-7", index: 3, waypoint_index: 3 }
        ],
        waypoints: [
            { original_location: [10, 20], location: [10, 20], start_time: 0, duration: 0, actions: [] }
        ]
    };

    const jobInputData: JobData = {
        id: "job-1",
        location: [10, 20],
        duration: 5,
        requirements: [],
        time_windows: []
    };

    test("should throw if job input is missing", () => {
        expect(() => new JobPlan(1, undefined as any, undefined)).toThrow("jobInputData is undefined");
    });

    test("should return undefined agent fields and empty actions when unassigned", () => {
        const plan = new JobPlan(1, jobInputData, undefined);
        expect(plan.getAgentId()).toBeUndefined();
        expect(plan.getAgentIndex()).toBeUndefined();
        expect(plan.getRouteActions()).toEqual([]);
        expect(plan.getAgentPlan()).toBeUndefined();
        expect(plan.getJobInputData()).toEqual(jobInputData);
        expect(plan.getJobIndex()).toBe(1);
    });

    test("should return assigned agent fields and only job actions for this job index", () => {
        const agentPlan = new AgentPlan(agentPlanData, agentInputData, routingOptions, callOptions, []);
        const plan = new JobPlan(1, jobInputData, agentPlan);
        const routeActions = plan.getRouteActions();

        expect(plan.getAgentId()).toBe("agent-2");
        expect(plan.getAgentIndex()).toBe(2);
        expect(plan.getAgentPlan()).toBe(agentPlan);
        expect(plan.getJobInputData()).toEqual(jobInputData);
        expect(plan.getJobIndex()).toBe(1);

        expect(routeActions).toHaveLength(2);
        expect(routeActions[0]).toBeInstanceOf(RouteAction);
        expect(routeActions[1]).toBeInstanceOf(RouteAction);
        expect(routeActions.every((action: RouteAction) => action.getJobIndex() === 1)).toBe(true);
    });
});
