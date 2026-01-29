import { RoutePlannerResultEditor, RoutePlanner } from '../../../src';
import TEST_API_KEY from '../../../env-variables';
import { loadJson } from '../../utils.helper';

describe('Simple Delivery Berlin - preserveOrder Issues', () => {
  
  test('1. Agent 3 => assign => order_10 + preserveOrder', async () => {
    const inputData = loadJson('data/route-planner-result-editor/shipment/simple-delivery-berlin-input.json');
    
    const planner = new RoutePlanner({ apiKey: TEST_API_KEY }, inputData);
    const result = await planner.plan();
    
    const editor = new RoutePlannerResultEditor(result);

    await editor.assignShipments(2, ['order_10'], {
      strategy: 'preserveOrder'
    });
  }, 60000);

  test('2. Agent 3 => remove => order_65 + preserveOrder => remove => order_66 + preserveOrder', async () => {
    const inputData = loadJson('data/route-planner-result-editor/shipment/simple-delivery-berlin-input.json');
    
    const planner = new RoutePlanner({ apiKey: TEST_API_KEY }, inputData);
    const result = await planner.plan();
    
    const editor = new RoutePlannerResultEditor(result);

    await editor.removeShipments(['order_65'], {
      strategy: 'preserveOrder'
    });
    await editor.removeShipments(['order_66'], {
      strategy: 'preserveOrder'
    });

    const modifiedResult = editor.getModifiedResult();
    const unassignedShipments = modifiedResult.getUnassignedShipments();
    const unassignedIds = unassignedShipments.map(unassignedShipment => unassignedShipment.id);

    expect(unassignedIds).toContain('order_65');
    expect(unassignedIds).toContain('order_66');
  }, 60000);
});
