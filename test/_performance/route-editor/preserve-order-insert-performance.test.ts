import { RoutePlannerResultEditor, Agent, Job, RoutePlanner, PRESERVE_ORDER } from '../../../src';
import TEST_API_KEY from '../../../env-variables';

// Mock fetch to count API requests
let matrixApiCallCount = 0;
let routingApiCallCount = 0;
const originalFetch = global.fetch;

function mockFetchWithCounter() {
    global.fetch = jest.fn(async (url: string | URL | Request, options?: any) => {
        const urlString = url.toString();
        
        // Count Matrix API calls (N→1 and 1→N for finding optimal insertion)
        if (urlString.includes('/routematrix')) {
            matrixApiCallCount++;
            console.log(`[Matrix API Call #${matrixApiCallCount}] ${urlString.substring(0, 80)}...`);
        }
        
        // Count Routing API calls (for consecutive travel times)
        if (urlString.includes('/routing?') && !urlString.includes('/routematrix')) {
            routingApiCallCount++;
            console.log(`[Routing API Call #${routingApiCallCount}] ${urlString.substring(0, 80)}...`);
        }
        
        return originalFetch(url, options);
    }) as jest.Mock;
}

function restoreFetch() {
    global.fetch = originalFetch;
}

function resetCounter() {
    matrixApiCallCount = 0;
    routingApiCallCount = 0;
}

function logPerformanceResults(params: {
    matrixRequests: number;
    routingRequests: number;
    waypointCount: number;
    operationDescription: string;
}) {
    const totalRequests = params.matrixRequests + params.routingRequests;
    console.log(`\n📊 API Requests for ${params.operationDescription}:`);
    console.log(`   - Matrix API (N→1, 1→N): ${params.matrixRequests} requests`);
    console.log(`   - Routing API (consecutive times): ${params.routingRequests} requests`);
    console.log(`   - Total: ${totalRequests} requests`);
    console.log(`📍 Route has ${params.waypointCount} waypoints`);
    console.log(`\n✅ Optimized: Reuses existing leg times when available, calls Routing API only when needed`);
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
            matrixRequests: matrixApiCallCount,
            routingRequests: routingApiCallCount,
            waypointCount,
            operationDescription: 'inserting 1 job'
        });
        
        // Expected: 2 Matrix API (N→1, 1→N) + 1 Routing API (recalc only - existing times reused for find)
        expect(matrixApiCallCount).toBe(2);
        expect(routingApiCallCount).toBe(1);
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
            matrixRequests: matrixApiCallCount,
            routingRequests: routingApiCallCount,
            waypointCount,
            operationDescription: 'inserting 1 shipment'
        });
        
        // Expected: 4 Matrix API (2 for pickup + 2 for delivery) + 2 Routing API (delivery + recalc)
        // Pickup reuses existing times, delivery needs Routing (route changed), recalc needs Routing
        expect(matrixApiCallCount).toBe(4);
        expect(routingApiCallCount).toBe(2);
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
            matrixRequests: matrixApiCallCount,
            routingRequests: routingApiCallCount,
            waypointCount: finalWaypointCount,
            operationDescription: '3 sequential job inserts'
        });
        
        // Expected: 6 Matrix API (2 per insert for finding optimal position)
        // Routing: With leg caching by location pairs, existing legs are reused
        // Only new legs that don't exist in the cache need routing API calls
        // Actual: 4 routing calls (batched calls for missing leg data across all 3 inserts)
        expect(matrixApiCallCount).toBe(6);
        expect(routingApiCallCount).toBe(4);
    }, 60000);
});
