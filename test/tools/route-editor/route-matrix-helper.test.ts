import { RouteMatrixHelper, RouteMatrixResponse } from "../../../src/tools/route-editor/strategies/preserve-order/utils/route-matrix-helper";
import TEST_API_KEY from "../../../env-variables";
import {RoutingOptions} from "../../../src";

const API_KEY = TEST_API_KEY;

describe('RouteMatrixHelper', () => {

  describe('calculateMatrix', () => {

    test('should call Route Matrix API with correct params', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      // Spy on fetch to capture request
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      const sources = [
        { location: [13.388860, 52.517037] as [number, number] }, // Berlin
        { location: [13.397634, 52.529407] as [number, number] }  // Berlin North
      ];
      const targets = [
        { location: [13.428555, 52.523219] as [number, number] }  // Berlin East
      ];
      
      await helper.calculateMatrix(sources, targets);
      
      // Verify API was called
      expect(fetchSpy).toHaveBeenCalled();
      
      // Verify URL
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('/v1/routematrix');
      expect(url).toContain('apiKey=');
      
      // Verify request body
      const requestBody = JSON.parse(options!.body as string);
      expect(requestBody.mode).toBe('drive');
      expect(requestBody.sources).toEqual(sources);
      expect(requestBody.targets).toEqual(targets);
      
      fetchSpy.mockRestore();
    });

    test('should return matrix with travel times and distances', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      const sources = [
        { location: [13.388860, 52.517037] as [number, number] }  // Berlin Mitte
      ];
      const targets = [
        { location: [13.428555, 52.523219] as [number, number] }  // Berlin East
      ];
      
      const result = await helper.calculateMatrix(sources, targets);
      
      // Verify response structure
      expect(result.sources).toBeDefined();
      expect(result.targets).toBeDefined();
      expect(result.sources_to_targets).toBeDefined();
      
      // Verify matrix dimensions
      expect(result.sources_to_targets.length).toBe(1); // 1 source
      expect(result.sources_to_targets[0].length).toBe(1); // 1 target
      
      // Verify entry contains time and distance
      const entry = result.sources_to_targets[0][0];
      expect(typeof entry.time).toBe('number');
      expect(typeof entry.distance).toBe('number');
      expect(entry.source_index).toBe(0);
      expect(entry.target_index).toBe(0);
    });

    test('should use custom mode when provided', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'walk' });
      
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      const sources = [{ location: [13.388860, 52.517037] as [number, number] }];
      const targets = [{ location: [13.428555, 52.523219] as [number, number] }];
      
      await helper.calculateMatrix(sources, targets);
      
      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(requestBody.mode).toBe('walk');
      
      fetchSpy.mockRestore();
    });

    test('should throw error when API fails', async () => {
      const helper = new RouteMatrixHelper({ apiKey: 'invalid-api-key' }, { mode: 'drive' });
      
      const sources = [{ location: [13.388860, 52.517037] as [number, number] }];
      const targets = [{ location: [13.428555, 52.523219] as [number, number] }];
      
      await expect(helper.calculateMatrix(sources, targets))
        .rejects.toThrow();
    });
  });

  describe('calculateTravelTime', () => {

    test('should return travel time between two points', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      const from: [number, number] = [13.388860, 52.517037];  // Berlin Mitte
      const to: [number, number] = [13.428555, 52.523219];    // Berlin East
      
      const travelTime = await helper.calculateTravelTime(from, to);
      
      // Should be a reasonable travel time (positive number)
      expect(typeof travelTime).toBe('number');
      expect(travelTime).toBeGreaterThan(0);
    });

    test('should call calculateMatrix internally', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      const matrixSpy = jest.spyOn(helper, 'calculateMatrix');
      
      const from: [number, number] = [13.388860, 52.517037];
      const to: [number, number] = [13.428555, 52.523219];
      
      await helper.calculateTravelTime(from, to);
      
      // Verify calculateMatrix was called with correct params
      expect(matrixSpy).toHaveBeenCalledWith(
        [{ location: from }],
        [{ location: to }]
      );
      
      matrixSpy.mockRestore();
    });
  });

  describe('calculateTimesToLocation', () => {
    test('should calculate travel times from all route locations to a target', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      const route: [number, number][] = [
        [13.3, 52.5],
        [13.4, 52.5]
      ];
      const target: [number, number] = [13.5, 52.5];
      
      const times = await helper.calculateTimesToLocation(route, target);
      
      expect(times).toHaveLength(2);
      times.forEach(time => {
        expect(time).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateTimesFromLocation', () => {
    test('should calculate travel times from a source to all route locations', async () => {
      const helper = new RouteMatrixHelper({ apiKey: API_KEY }, { mode: 'drive' });
      
      const source: [number, number] = [13.3, 52.5];
      const route: [number, number][] = [
        [13.4, 52.5],
        [13.5, 52.5]
      ];
      
      const times = await helper.calculateTimesFromLocation(source, route);
      
      expect(times).toHaveLength(2);
      times.forEach(time => {
        expect(time).toBeGreaterThan(0);
      });
    });
  });

  test('should pass all routing options to Route Matrix API', async () => {
    const routingOptions = {
      mode: 'light_truck',
      type: 'balanced',
      avoid: [
        {
          type: 'tolls'
        },
        {
          type: 'ferries'
        }
      ],
      traffic: 'approximated',
      max_speed: 90,
      units: 'metric'
    } as RoutingOptions;

    const helper = new RouteMatrixHelper({ apiKey: API_KEY }, routingOptions);

    const fetchSpy = jest.spyOn(global, 'fetch');

    const sources = [{ location: [12.345, 67.890] as [number, number] }];
    const targets = [{ location: [12.345, 67.890] as [number, number] }];

    let matrixResponse: any = await helper.calculateMatrix(sources, targets);
    // Didn't include parameter fields in RouteMatrixResponse as they are not documented here: https://apidocs.geoapify.com/docs/route-matrix/
    expect(matrixResponse.mode).toBe('light_truck');
    expect(matrixResponse.type).toBe('balanced');
    expect(matrixResponse.avoid).toEqual([
      { type: 'tolls' },
      { type: 'ferries' }
    ]);
    expect(matrixResponse.traffic).toBe('approximated');
    expect(matrixResponse.max_speed).toBe(90);
    expect(matrixResponse.units).toBe('metric');

    fetchSpy.mockRestore();
  });
});

