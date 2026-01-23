import { RoutePlannerResultEditor, Agent, Job, RoutePlanner, PRESERVE_ORDER } from '../../../src';
import TEST_API_KEY from '../../../env-variables';

// Mock fetch to count Matrix API requests
let matrixApiCallCount = 0;
const originalFetch = global.fetch;

function mockFetchWithCounter() {
    global.fetch = jest.fn(async (url: string | URL | Request, options?: any) => {
        const urlString = url.toString();
        
        // Count Matrix API calls
        if (urlString.includes('/routematrix')) {
            matrixApiCallCount++;
            console.log(`[Matrix API Call #${matrixApiCallCount}] ${urlString.substring(0, 80)}...`);
        }
        return originalFetch(url, options);
    }) as jest.Mock;
}

function restoreFetch() {
    global.fetch = originalFetch;
}

function resetCounter() {
    matrixApiCallCount = 0;
}

function logPerformanceResults(params: {
    actualRequests: number;
    waypointCount: number;
    expectedCurrent?: number;
    optimizedRequests: number;
    operationDescription: string;
}) {
    console.log(`\n📊 Matrix API Requests Made: ${params.actualRequests}`);
    console.log(`📍 Route has ${params.waypointCount} waypoints`);
    if (params.expectedCurrent) {
        console.log(`⚠️  Expected with current implementation: ~${params.expectedCurrent} requests`);
    }
    console.log(`✅ Expected with optimization: ${params.optimizedRequests} requests (parallel)`);
    
    const reduction = Math.round((1 - params.optimizedRequests / params.actualRequests) * 100);
    console.log(`\n❌ Issue confirmed: ${params.actualRequests} API requests for ${params.operationDescription}!`);
    console.log(`💡 Potential savings: ${params.actualRequests - params.optimizedRequests} fewer requests (${reduction}% reduction)`);
}

describe('PreserveOrder Insert Performance - Matrix API Request Count', () => {
    
    beforeEach(() => {
        mockFetchWithCounter();
        resetCounter();
    });
    
    afterEach(() => {
        restoreFetch();
    });

    it('should count Matrix API requests when inserting a job into a route with 10 waypoints', async () => {
        // Create a route with 10 jobs (will have 10+ waypoints including start/end)
        const planner = new RoutePlanner({ apiKey: TEST_API_KEY });
        planner.setMode('drive');
        
        const agent = new Agent()
            .setId('agent-1')
            .setStartLocation(-77.0369, 38.9072);
        planner.addAgent(agent);
        
        // Add 10 jobs to create a route with multiple waypoints
        for (let i = 0; i < 10; i++) {
            const job = new Job()
                .setId(`existing-job-${i}`)
                .setLocation(-77.0369 + (i * 0.001), 38.9072 + (i * 0.001))
                .setDuration(300);
            planner.addJob(job);
        }
        
        console.log('\n=== Initial Planning ===');
        const result = await planner.plan();
        const waypointCount = result.getAgentPlans()[0]!.getWaypoints().length;
        console.log(`✓ Initial route created with ${waypointCount} waypoints`);
        
        resetCounter();
        
        const newJob = new Job()
            .setId('new-job-to-insert')
            .setLocation(-77.0400, 38.9090)
            .setDuration(300);
        
        console.log('\n=== Inserting Job with PreserveOrder (finding optimal position) ===');
        const editor = new RoutePlannerResultEditor(result);
        await editor.addNewJobs(0, [newJob], { strategy: PRESERVE_ORDER });
        
        logPerformanceResults({
            actualRequests: matrixApiCallCount,
            waypointCount,
            expectedCurrent: waypointCount - 1,
            optimizedRequests: 4,
            operationDescription: 'inserting 1 job'
        });
        
        // Optimized version should make ~4 requests (3 for insertion + 1 for time recalc)
        expect(matrixApiCallCount).toBeLessThan(6);
        expect(matrixApiCallCount).toBeGreaterThanOrEqual(3);
    }, 60000);

    it('should count Matrix API requests when inserting a shipment (pickup + delivery)', async () => {
        // Create a route with 8 jobs
        const planner = new RoutePlanner({ apiKey: TEST_API_KEY });
        planner.setMode('drive');
        
        const agent = new Agent()
            .setId('agent-1')
            .setStartLocation(-77.0369, 38.9072);
        planner.addAgent(agent);
        
        for (let i = 0; i < 8; i++) {
            const job = new Job()
                .setId(`existing-job-${i}`)
                .setLocation(-77.0369 + (i * 0.001), 38.9072 + (i * 0.001))
                .setDuration(300);
            planner.addJob(job);
        }
        
        console.log('\n=== Initial Planning ===');
        const result = await planner.plan();
        const waypointCount = result.getAgentPlans()[0]!.getWaypoints().length;
        console.log(`✓ Initial route created with ${waypointCount} waypoints`);
        
        resetCounter();
        
        // Insert a shipment (requires finding 2 positions: pickup and delivery)
        const { Shipment, ShipmentStep } = await import('../../../src');
        const newShipment = new Shipment()
            .setId('new-shipment')
            .setPickup(new ShipmentStep().setLocation(-77.0380, 38.9080).setDuration(120))
            .setDelivery(new ShipmentStep().setLocation(-77.0420, 38.9100).setDuration(120));
        
        console.log('\n=== Inserting Shipment with PreserveOrder ===');
        const editor = new RoutePlannerResultEditor(result);
        await editor.addNewShipments(0, [newShipment], { strategy: PRESERVE_ORDER });
        
        logPerformanceResults({
            actualRequests: matrixApiCallCount,
            waypointCount,
            expectedCurrent: (waypointCount - 1) * 2,
            optimizedRequests: 5,
            operationDescription: 'inserting 1 shipment'
        });
        
        // Optimized: 3 for pickup + 2 for delivery (reuses consecutiveTimes) + time recalc
        expect(matrixApiCallCount).toBeLessThan(8);
        expect(matrixApiCallCount).toBeGreaterThanOrEqual(4);
    }, 60000);

    it('should demonstrate the cost for multiple sequential inserts', async () => {
        const planner = new RoutePlanner({ apiKey: TEST_API_KEY });
        planner.setMode('drive');
        
        const agent = new Agent()
            .setId('agent-1')
            .setStartLocation(-77.0369, 38.9072);
        planner.addAgent(agent);
        
        // Create initial route with 5 jobs
        for (let i = 0; i < 5; i++) {
            const job = new Job()
                .setId(`existing-job-${i}`)
                .setLocation(-77.0369 + (i * 0.002), 38.9072 + (i * 0.002))
                .setDuration(300);
            planner.addJob(job);
        }
        
        console.log('\n=== Initial Planning ===');
        const result = await planner.plan();
        console.log(`✓ Initial route created`);
        
        resetCounter();
        
        // Insert 3 jobs sequentially
        console.log('\n=== Inserting 3 Jobs Sequentially ===');
        const editor = new RoutePlannerResultEditor(result);
        
        for (let i = 0; i < 3; i++) {
            const newJob = new Job()
                .setId(`new-job-${i}`)
                .setLocation(-77.0400 + (i * 0.001), 38.9090 + (i * 0.001))
                .setDuration(300);
            
            console.log(`\nInserting job ${i + 1}/3...`);
            const callsBefore = matrixApiCallCount;
            await editor.addNewJobs(0, [newJob], { strategy: PRESERVE_ORDER });
            const callsForThis = matrixApiCallCount - callsBefore;
            console.log(`  → ${callsForThis} Matrix API requests`);
        }
        
        const finalWaypointCount = editor.getModifiedResult().getAgentPlans()[0]!.getWaypoints().length;
        
        logPerformanceResults({
            actualRequests: matrixApiCallCount,
            waypointCount: finalWaypointCount,
            optimizedRequests: 12,
            operationDescription: '3 sequential job inserts'
        });
        
        // Optimized: ~4 requests per insert = 12 total
        expect(matrixApiCallCount).toBeLessThan(15);
        expect(matrixApiCallCount).toBeGreaterThanOrEqual(10);
    }, 60000);
});

