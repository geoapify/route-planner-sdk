import { universalFetch } from "../../src/tools/fetch";

jest.mock('node-fetch', () => jest.fn(async (url, options) => ({
  json: async () => ({ status: 'mocked-node-fetch' }),
  status: 200,
})), { virtual: true });

const mockFetchResponse = {
  json: async () => ({ status: 'mocked-fetch' }),
  status: 200,
};

describe('universalFetch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should use fetch in the frontend environment', async () => {
    global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse)) as jest.Mock;
    const response = await universalFetch('https://example.com', {});
    const json = await response.json();

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {});
    expect(json.status).toBe('mocked-fetch');
    expect(response.status).toBe(200);
  });

  it('should throw an error when fetch is unavailable in the backend', async () => {
    const originalFetch = global.fetch;
    delete (global as any).fetch;
    jest.resetModules();

    jest.mock('node-fetch', () => {
      throw new Error('node-fetch is not installed');
    });

    await expect(universalFetch('https://example.com', {})).rejects.toThrow(
        'Fetch is not available in this environment'
    );

    global.fetch = originalFetch;
  });
});