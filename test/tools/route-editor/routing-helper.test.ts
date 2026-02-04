import { RoutingHelper } from "../../../src/tools/route-editor/strategies/preserve-order/utils/routing-helper";
import TEST_API_KEY from "../../../env-variables";

const API_KEY = TEST_API_KEY;

describe('RoutingHelper', () => {

  test('should return empty array for less than 2 locations', async () => {
    const helper = new RoutingHelper({ apiKey: API_KEY }, { mode: 'drive' });
    
    expect(await helper.calculateConsecutiveTravelTimes([])).toEqual([]);
    expect(await helper.calculateConsecutiveTravelTimes([[13.388860, 52.517037]])).toEqual([]);
  });

  test('should calculate consecutive travel times using Routing API', async () => {
    const helper = new RoutingHelper({ apiKey: API_KEY }, { mode: 'drive' });
    
    const locations: [number, number][] = [
      [13.3, 52.5],   // Point A
      [13.4, 52.5],   // Point B
      [13.5, 52.5]    // Point C
    ];
    
    const times = await helper.calculateConsecutiveTravelTimes(locations);
    
    // Should return N-1 travel times for N locations
    expect(times).toHaveLength(2);
    
    times.forEach(time => {
      expect(time).toBeGreaterThan(0);
    });
  });

  test('should call Routing API not Route Matrix API', async () => {
    const helper = new RoutingHelper({ apiKey: API_KEY }, { mode: 'drive' });
    
    const fetchSpy = jest.spyOn(global, 'fetch');
    
    const locations: [number, number][] = [
      [13.3, 52.5],
      [13.4, 52.5]
    ];
    
    await helper.calculateConsecutiveTravelTimes(locations);
    
    const url = fetchSpy.mock.calls[0][0].toString();
    expect(url).toContain('/v1/routing?');
    expect(url).not.toContain('/routematrix');
    
    fetchSpy.mockRestore();
  });
});

