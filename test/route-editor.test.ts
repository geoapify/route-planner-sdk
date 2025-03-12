import RoutePlanner, {
  RouteEditor,
  Location,
} from "../src";

const API_KEY = "TEST_API_KEY";

describe('RouteEditor', () => {
  test('removeLocation should work as expected', async () => {
    let planner = new RoutePlanner({apiKey: API_KEY});
    planner.addLocation(new Location().setId('1'));
    expect(planner.getRaw().locations.length).toBe(1);

    const routeEditor = new RouteEditor(planner);
    routeEditor.removeLocation('1');
    expect(planner.getRaw().locations.length).toBe(0);
  });
});
