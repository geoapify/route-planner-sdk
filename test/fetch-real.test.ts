import { universalFetch } from "../src/tools/fetch";

describe('universalFetch', () => {
  test('should fetch data from a real endpoint', async () => {
    const url = 'https://jsonplaceholder.typicode.com/todos/1';

    const response = await universalFetch(url, {});
    const data = await response.json();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data.id).toBe(1);
  });
});
