import RoutePlanner, {
    RoutePlannerResultEditor,
    Agent, Job, Shipment, ShipmentStep,
    AgentMissingCapability,
    AgentPickupCapacityExceeded,
    AgentDeliveryCapacityExceeded,
    TimeWindowViolation,
    BreakViolation,
    ValidationErrors
} from "../../../src";
import { Break } from "../../../src/models/entities/nested/input/break";
import TEST_API_KEY from "../../../env-variables";

const API_KEY = TEST_API_KEY;

// Test helpers for validation
const expectValidationErrors = (error: any, expectedErrors: Array<{ type: any, message: string }>) => {
    expect(error).toBeInstanceOf(ValidationErrors);
    expect(error.errors).toHaveLength(expectedErrors.length);
    
    expectedErrors.forEach((expected, index) => {
        expect(error.errors[index]).toBeInstanceOf(expected.type);
        expect(error.errors[index].message).toBe(expected.message);
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

    describe('AgentMissingCapability', () => {

        test('should reject refrigerated delivery assigned to regular van', async () => {
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

            const error = await editor.addNewJobs(0, [refrigeratedJob], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentMissingCapability, message: "Agent is missing required capability: 'refrigerated'" }
            ]);
        });

        test('should reject hazmat without certification', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'uncertified-driver',
                capabilities: ['standard_delivery']
            }));

            planner.addJob(createJob({ id: 'safe-job' }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const hazmatJob = createJob({
                id: 'dangerous-chemicals',
                requirements: ['hazmat_certified']
            });

            const error = await editor.addNewJobs(0, [hazmatJob], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentMissingCapability, message: "Agent is missing required capability: 'hazmat_certified'" }
            ]);
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
                editor.addNewJobs(0, [specialJob])
            ).resolves.toBe(true);
        });
    });

    describe('AgentPickupCapacityExceeded', () => {

        test('should reject pickup exceeding van capacity', async () => {
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

            const error = await editor.addNewJobs(0, heavyJobs, { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentPickupCapacityExceeded, message: "Total pickup amount (800) exceeds agent capacity (500)" }
            ]);
        });

        test('should accept pickup within capacity', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'cargo-van',
                pickupCapacity: 1000
            }));

            planner.addJob(createJob({ id: 'job-1', pickupAmount: 200 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            const moreJobs = [
                createJob({ id: 'job-2', pickupAmount: 300 }),
                createJob({ id: 'job-3', pickupAmount: 300 })
            ]; // Total: 800kg (within 1000kg)

            await expect(
                editor.addNewJobs(0, moreJobs)
            ).resolves.toBe(true);
        });
    });

    describe('AgentDeliveryCapacityExceeded', () => {

        test('should reject delivery exceeding truck capacity', async () => {
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

            const error = await editor.addNewJobs(0, heavyDeliveries, { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentDeliveryCapacityExceeded, message: "Total delivery amount (1100) exceeds agent capacity (800)" }
            ]);
        });
    });

    describe('TimeWindowViolation', () => {

        test('should reject job outside agent work hours', async () => {
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

            const error = await editor.addNewJobs(0, [eveningJob], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: TimeWindowViolation, message: "No overlap between agent and job time windows" }
            ]);
        });

        test('should accept job with partial time window overlap', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'flexible-agent',
                timeWindows: [[32400, 61200]] // 9am-5pm
            }));

            planner.addJob(createJob({ id: 'job-1', timeWindows: [[36000, 43200]] }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job 4pm-6pm (overlaps 4pm-5pm)
            const lateJob = createJob({
                id: 'late-afternoon',
                timeWindows: [[57600, 64800]]
            });

            await expect(
                editor.addNewJobs(0, [lateJob])
            ).resolves.toBe(true);
        });
    });

    describe('BreakViolation', () => {

        test('should reject job that can only be done during lunch break', async () => {
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

            const error = await editor.addNewJobs(0, [lunchOnlyJob], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: BreakViolation, message: "All job windows fall within agent break periods" }
            ]);
        });

        test('should accept job that spans across break period', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            const lunchBreak = new Break()
                .addTimeWindow(43200, 46800); // 12pm-1pm

            planner.addAgent(createAgent({
                id: 'driver',
                timeWindows: [[32400, 61200]],
                breaks: [lunchBreak]
            }));

            planner.addJob(createJob({ id: 'job-1', timeWindows: [[36000, 39600]] }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job 11:30am-1:30pm (spans lunch, can be done before or after)
            const spanningJob = createJob({
                id: 'flexible-job',
                timeWindows: [[41400, 48600]]
            });

            await expect(
                editor.addNewJobs(0, [spanningJob])
            ).resolves.toBe(true);
        });
    });

    describe('Shipment validations', () => {

        test('should reject shipment with missing capability', async () => {
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
            const error = await editor.addNewShipments(0, [fragileShipment], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentMissingCapability, message: "Agent is missing required capabilities: fragile, careful_handling" }
            ]);
        });

        test('should reject shipment exceeding pickup capacity', async () => {
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

            const error = await editor.addNewShipments(0, heavyShipments, { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentPickupCapacityExceeded, message: "Total shipment amount (70) exceeds agent pickup capacity (50)" }
            ]);
        });
    });

    describe('Multiple validation errors', () => {

        test('should return all violations when job has multiple issues', async () => {
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

            const error = await editor.addNewJobs(0, [problematicJob], { allowViolations: false })
                .catch(e => e);
            
            expectValidationErrors(error, [
                { type: AgentMissingCapability, message: "Agent is missing required capabilities: refrigerated, hazmat_certified" },
                { type: TimeWindowViolation, message: "No overlap between agent and job time windows" },
                { type: AgentDeliveryCapacityExceeded, message: "Total delivery amount (600) exceeds agent capacity (500)" }
            ]);
        });

        test('should add violations to issues when allowViolations is true (default)', async () => {
            const planner = new RoutePlanner({ apiKey: API_KEY });
            planner.setMode("drive");

            planner.addAgent(createAgent({
                id: 'basic-driver',
                capabilities: ['standard'],
                deliveryCapacity: 500
            }));

            planner.addJob(createJob({ id: 'job-1', deliveryAmount: 200 }));

            const result = await planner.plan();
            const editor = new RoutePlannerResultEditor(result);

            // Job that exceeds capacity
            const overloadedJob = createJob({
                id: 'heavy-job',
                deliveryAmount: 400 // 200 + 400 = 600, exceeds 500
            });

            // Default behavior: allowViolations = true
            const success = await editor.addNewJobs(0, [overloadedJob]);
            
            expect(success).toBe(true);
            expect(editor.getModifiedResult().getViolations()).toContain(
                "Total delivery amount (600) exceeds agent capacity (500)"
            );
        });

        test('should add multiple violations to issues by default', async () => {
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

            // Default: don't pass allowViolations (defaults to true)
            const success = await editor.addNewJobs(0, [multiIssueJob]);
            
            expect(success).toBe(true);
            
            const violations = editor.getModifiedResult().getViolations();
            expect(violations).toHaveLength(3);
            expect(violations).toContain("Agent is missing required capabilities: refrigerated, hazmat_certified");
            expect(violations).toContain("No overlap between agent and job time windows");
            expect(violations).toContain("Total delivery amount (600) exceeds agent capacity (500)");
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
                editor.addNewJobs(0, coldChainJobs)
            ).resolves.toBe(true);
        });
    });
});
