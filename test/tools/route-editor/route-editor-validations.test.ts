import RoutePlanner, {
    RoutePlannerResultEditor,
    Agent, Job, Shipment, ShipmentStep, ViolationError, PRESERVE_ORDER,
    AgentMissingCapability, AgentPickupCapacityExceeded, AgentDeliveryCapacityExceeded
} from "../../../src";
import { Break } from "../../../src/models/entities/nested/input/break";
import TEST_API_KEY from "../../../env-variables";

const API_KEY = TEST_API_KEY;

const expectViolations = (violations: ViolationError[], expectedMessages: string[]) => {
    expect(violations).toHaveLength(expectedMessages.length);
    expectedMessages.forEach((expectedMessage) => {
        expect(violations.map(v => v.message)).toContain(expectedMessage);
    });
};

// Test helpers for creating realistic scenarios
const createAgent = (overrides: any = {}) => {
    const agent = new Agent()
        .setStartLocation(44.45876, 40.22179)
        .setId(overrides.id || 'test-agent');
    
    if (overrides.capabilities) {
        overrides.capabilities.forEach((cap: string) => agent.addCapability(cap));
    }
    if (overrides.timeWindows) {
        overrides.timeWindows.forEach(([start, end]: [number, number]) => agent.addTimeWindow(start, end));
    }
    if (overrides.breaks) {
        overrides.breaks.forEach((brk: any) => agent.addBreak(brk));
    }
    if (overrides.pickupCapacity !== undefined) {
        agent.setPickupCapacity(overrides.pickupCapacity);
    }
    if (overrides.deliveryCapacity !== undefined) {
        agent.setDeliveryCapacity(overrides.deliveryCapacity);
    }
    
    return agent;
};

const createJob = (overrides: any = {}) => {
    const job = new Job()
        .setLocation(44.5093, 40.1868)
        .setId(overrides.id || 'test-job');
    
    if (overrides.requirements) {
        overrides.requirements.forEach((req: string) => job.addRequirement(req));
    }
    if (overrides.timeWindows) {
        overrides.timeWindows.forEach(([start, end]: [number, number]) => job.addTimeWindow(start, end));
    }
    if (overrides.pickupAmount !== undefined) {
        job.setPickupAmount(overrides.pickupAmount);
    }
    if (overrides.deliveryAmount !== undefined) {
        job.setDeliveryAmount(overrides.deliveryAmount);
    }
    
    return job;
};

const createShipment = (overrides: any = {}) => {
    const shipment = new Shipment()
        .setId(overrides.id || 'test-shipment');
    
    if (overrides.requirements) {
        overrides.requirements.forEach((req: string) => shipment.addRequirement(req));
    }
    if (overrides.amount !== undefined) {
        shipment.setAmount(overrides.amount);
    }
    if (overrides.pickup) {
        const pickup = new ShipmentStep().setLocation(44.5093, 40.1868);
        if (overrides.pickup.timeWindows) {
            overrides.pickup.timeWindows.forEach(([start, end]: [number, number]) => pickup.addTimeWindow(start, end));
        }
        shipment.setPickup(pickup);
    }
    if (overrides.delivery) {
        const delivery = new ShipmentStep().setLocation(44.4004, 40.1537);
        if (overrides.delivery.timeWindows) {
            overrides.delivery.timeWindows.forEach(([start, end]: [number, number]) => delivery.addTimeWindow(start, end));
        }
        shipment.setDelivery(delivery);
    }
    
    return shipment;
};

describe('Route Editor Validation - Real World Scenarios', () => {

    test('ViolationError toString should return message', () => {
        const violation = new ViolationError("Test violation message", 0);
        expect(violation.toString()).toBe("Test violation message");
    });

    describe('Strategy-based validation', () => {
        
        test('addNewJobs should not validate with reoptimize strategy (default)', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'regular-van',
                capabilities: ['standard_delivery']
            }));

            planner.addJob(createJob({ id: 'regular-job' }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const refrigeratedJob = createJob({
                id: 'cold-food',
                requirements: ['refrigerated']
            });

            // Default strategy (reoptimize) - no client-side validation
            await editor.addNewJobs(0, [refrigeratedJob]);
            
            const violations = editor.getModifiedResult().getAgentPlan(0)!.getViolations();
            expect(violations).toHaveLength(0);
        });

        test('addNewShipments should not validate with reoptimize strategy (default)', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'regular-courier',
                capabilities: ['standard']
            }));

            planner.addShipment(createShipment({
                id: 'initial-shipment',
                pickup: { timeWindows: [] },
                delivery: { timeWindows: [] }
            }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const fragileShipment = createShipment({
                id: 'glass-shipment',
                requirements: ['fragile', 'careful_handling'],
                pickup: { timeWindows: [] },
                delivery: { timeWindows: [] }
            });

            // Default strategy (reoptimize) - no client-side validation
            await editor.addNewShipments(0, [fragileShipment]);
            
            const violations = editor.getModifiedResult().getAgentPlan(0)!.getViolations();
            expect(violations).toHaveLength(0);
        });
    });

    describe('AgentMissingCapability', () => {

        test('should store violation when agent missing required capability', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Regular van without refrigeration
            planner.addAgent(createAgent({
                id: 'regular-van',
                capabilities: ['standard_delivery']
            }));

            // Regular job (will be assigned)
            planner.addJob(createJob({ id: 'regular-job' }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Try to add refrigerated job
            const refrigeratedJob = createJob({
                id: 'cold-food',
                requirements: ['refrigerated']
            });

            await editor.addNewJobs(0, [refrigeratedJob], { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Agent is missing required capability: 'refrigerated'"
            ]);
            
            expect((violations[0] as AgentMissingCapability).missingCapabilities).toEqual(['refrigerated']);
        });

        test('should accept job when agent has required capabilities', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'certified-driver',
                capabilities: ['refrigerated', 'fragile', 'hazmat_certified']
            }));

            planner.addJob(createJob({ id: 'initial-job' }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const specialJob = createJob({
                id: 'special-delivery',
                requirements: ['refrigerated', 'fragile']
            });

            await expect(
                editor.addNewJobs(0, [specialJob], { strategy: PRESERVE_ORDER })
            ).resolves.toBe(true);
        });
    });

    describe('AgentPickupCapacityExceeded', () => {

        test('should store violation when pickup exceeds capacity', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Small van with 500kg capacity
            planner.addAgent(createAgent({
                id: 'small-van',
                pickupCapacity: 500
            }));

            planner.addJob(createJob({ id: 'light-job', pickupAmount: 100 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Try to add jobs totaling 700kg (exceeds 500kg)
            const heavyJobs = [
                createJob({ id: 'heavy-1', pickupAmount: 250 }),
                createJob({ id: 'heavy-2', pickupAmount: 250 }),
                createJob({ id: 'heavy-3', pickupAmount: 200 })
            ];

            await editor.addNewJobs(0, heavyJobs, { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Pickup capacity exceeded at action 3: load 600 > capacity 500"
            ]);
            expect((violations[0] as AgentPickupCapacityExceeded).totalAmount).toBe(600);
            expect((violations[0] as AgentPickupCapacityExceeded).capacity).toBe(500);
        });
    });

    describe('AgentDeliveryCapacityExceeded', () => {

        test('should store violation when delivery exceeds truck capacity', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'delivery-truck',
                deliveryCapacity: 800
            }));

            planner.addJob(createJob({ id: 'job-1', deliveryAmount: 300 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const heavyDeliveries = [
                createJob({ id: 'del-1', deliveryAmount: 400 }),
                createJob({ id: 'del-2', deliveryAmount: 400 })
            ]; // Total: 1100kg (300 existing + 800 new, exceeds 800kg)

            await editor.addNewJobs(0, heavyDeliveries, { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Initial delivery load 1100 exceeds agent delivery capacity 800"
            ]);
            expect((violations[0] as AgentDeliveryCapacityExceeded).totalAmount).toBe(1100);
            expect((violations[0] as AgentDeliveryCapacityExceeded).capacity).toBe(800);
        });
    });

    describe('TimeWindowViolation', () => {

        test('should store violation when job outside agent work hours', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Day shift agent: 9am-5pm (32400-61200 seconds from midnight)
            planner.addAgent(createAgent({
                id: 'day-shift',
                timeWindows: [[32400, 61200]]
            }));

            planner.addJob(createJob({ id: 'morning-job', timeWindows: [[36000, 43200]] }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Evening job: 6pm-8pm (64800-72000) - outside work hours
            const eveningJob = createJob({
                id: 'evening-delivery',
                timeWindows: [[64800, 72000]]
            });

            await editor.addNewJobs(0, [eveningJob], { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Action at time 36000.004 is outside job time windows"
            ]);
        });
    });

    describe('BreakViolation', () => {

        test('should store violation when job can only be done during break', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            const lunchBreak = new Break()
                .addTimeWindow(43200, 46800); // 12pm-1pm

            planner.addAgent(createAgent({
                id: 'driver',
                timeWindows: [[32400, 61200]], // 9am-5pm
                breaks: [lunchBreak]
            }));

            planner.addJob(createJob({ id: 'morning-job', timeWindows: [[36000, 39600]] }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job that can ONLY be done during lunch (12:10pm-12:45pm)
            const lunchOnlyJob = createJob({
                id: 'lunch-time-only',
                timeWindows: [[43800, 45900]]
            });

            await editor.addNewJobs(0, [lunchOnlyJob], { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Action at time 39600.004 is outside job time windows",
                "Action at time 39600.004 conflicts with agent break",
                "Action at time 43200.004 conflicts with agent break"
            ]);
        });
    });

    describe('Shipment validations', () => {

        test('should store violation when shipment has missing capabilities', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'regular-courier',
                capabilities: ['standard']
            }));

            // Need at least one initial shipment for plan to work
            planner.addShipment(createShipment({
                id: 'initial-shipment',
                pickup: { timeWindows: [] },
                delivery: { timeWindows: [] }
            }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const fragileShipment = createShipment({
                id: 'glass-shipment',
                requirements: ['fragile', 'careful_handling'],
                pickup: { timeWindows: [] },
                delivery: { timeWindows: [] }
            });

            // Should list ALL missing capabilities
            await editor.addNewShipments(0, [fragileShipment], { strategy: 'preserveOrder' });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Agent is missing required capabilities: fragile, careful_handling"
            ]);
            expect((violations[0] as AgentMissingCapability).missingCapabilities).toEqual(['fragile', 'careful_handling']);
        });

        test('should store violation when shipment exceeds capacity', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'small-courier',
                pickupCapacity: 50 // Only pickup capacity for shipments
            }));

            // Initial small shipment
            planner.addShipment(createShipment({ 
                id: 'initial-pkg',
                amount: 10,
                pickup: { timeWindows: [] },
                delivery: { timeWindows: [] }
            }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const heavyShipments = [
                createShipment({ 
                    id: 'pkg-1', 
                    amount: 30,
                    pickup: { timeWindows: [] },
                    delivery: { timeWindows: [] }
                }),
                createShipment({ 
                    id: 'pkg-2', 
                    amount: 30,
                    pickup: { timeWindows: [] },
                    delivery: { timeWindows: [] }
                })
            ]; // Total new: 60kg (exceeds 50kg pickup)

            await editor.addNewShipments(0, heavyShipments, { strategy: 'preserveOrder' });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Pickup capacity exceeded at action 3: load 70 > capacity 50"
            ]);
        });
    });

    describe('Multiple validation errors', () => {

        test('should store all violations when job has multiple issues', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Agent: only works 9am-5pm, has no special capabilities, limited capacity
            planner.addAgent(createAgent({
                id: 'basic-driver',
                capabilities: ['standard'],
                timeWindows: [[32400, 61200]], // 9am-5pm
                deliveryCapacity: 500
            }));

            planner.addJob(createJob({ id: 'job-1', deliveryAmount: 200 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job with MULTIPLE issues: wrong capability, wrong time, exceeds capacity
            const problematicJob = createJob({
                id: 'problem-job',
                requirements: ['refrigerated', 'hazmat_certified'], // Missing both
                timeWindows: [[64800, 72000]], // 6pm-8pm (outside work hours)
                deliveryAmount: 400 // 200 + 400 = 600, exceeds 500
            });

            await editor.addNewJobs(0, [problematicJob], { strategy: PRESERVE_ORDER });
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expectViolations(violations, [
                "Action at time 33059.004 is outside job time windows",
                "Initial delivery load 600 exceeds agent delivery capacity 500",
                "Agent is missing required capabilities: refrigerated, hazmat_certified"
            ]);
            
            expect((violations[1] as AgentDeliveryCapacityExceeded).totalAmount).toBe(600);
            expect((violations[1] as AgentDeliveryCapacityExceeded).capacity).toBe(500);
            expect((violations[2] as AgentMissingCapability).missingCapabilities).toEqual(['refrigerated', 'hazmat_certified']);
        });

        test('should store multiple violations in result', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Agent: limited capabilities, work hours, and capacity
            planner.addAgent(createAgent({
                id: 'limited-driver',
                capabilities: ['standard'],
                timeWindows: [[32400, 61200]], // 9am-5pm
                deliveryCapacity: 500
            }));

            planner.addJob(createJob({ id: 'job-1', deliveryAmount: 200 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job with multiple issues
            const multiIssueJob = createJob({
                id: 'problematic-delivery',
                requirements: ['refrigerated', 'hazmat_certified'], // Missing both
                timeWindows: [[64800, 72000]], // 6pm-8pm (outside work hours)
                deliveryAmount: 400 // 200 + 400 = 600, exceeds 500
            });

            // All violations are stored in the result
            const success = await editor.addNewJobs(0, [multiIssueJob], { strategy: PRESERVE_ORDER });
            
            expect(success).toBe(true);
            
            const modifiedResult = editor.getModifiedResult();
            const agentPlan = modifiedResult.getAgentPlan(0);
            const violations = agentPlan!.getViolations();
            expect(violations).toHaveLength(3);
            expectViolations(violations, [
                "Agent is missing required capabilities: refrigerated, hazmat_certified",
                "Action at time 33059.004 is outside job time windows",
                "Initial delivery load 600 exceeds agent delivery capacity 500"
            ]);
        });
    });


    describe('Real-world combination scenarios', () => {

        test('should validate complete refrigerated delivery scenario', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            // Refrigerated van: proper capabilities, time windows, and capacity (delivery only)
            planner.addAgent(createAgent({
                id: 'cold-chain-van',
                capabilities: ['refrigerated', 'standard_delivery'],
                timeWindows: [[28800, 64800]], // 8am-6pm
                deliveryCapacity: 300 // Only delivery capacity
            }));

            planner.addJob(createJob({ id: 'job-1', deliveryAmount: 50 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const coldChainJobs = [
                createJob({
                    id: 'frozen-food-1',
                    requirements: ['refrigerated'],
                    timeWindows: [[32400, 54000]], // 9am-3pm
                    deliveryAmount: 100
                }),
                createJob({
                    id: 'frozen-food-2',
                    requirements: ['refrigerated'],
                    timeWindows: [[36000, 57600]], // 10am-4pm
                    deliveryAmount: 100
                })
            ];

            // Should pass all validations
            await expect(
                editor.addNewJobs(0, coldChainJobs, { strategy: PRESERVE_ORDER })
            ).resolves.toBe(true);
        });
    });
});
