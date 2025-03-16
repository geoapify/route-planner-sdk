import { universalFetch } from "../../src/tools/fetch";

describe("universalFetch", () => {
  const mockResponse = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should use native fetch when available", async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const response = await universalFetch("https://example.com", {});
    expect(global.fetch).toHaveBeenCalledWith("https://example.com", {});
    expect(response).toBe(mockResponse);
  });

  test("should fallback to node-fetch when fetch is undefined", async () => {
    delete (global as any).fetch;

    const mockNodeFetch = jest.fn().mockResolvedValue(mockResponse);
    jest.spyOn(global, "Function").mockImplementation(() => {
      return () =>
          Promise.resolve({
            default: mockNodeFetch,
          });
    });

    const response = await universalFetch("https://example.com", {});
    expect(mockNodeFetch).toHaveBeenCalledWith("https://example.com", {});
    expect(response).toBe(mockResponse);
  });

  test("should throw an error if fetch is unavailable and node-fetch fails to load", async () => {
    delete (global as any).fetch;

    jest.spyOn(global, "Function").mockImplementation(() => {
      return () => Promise.reject(new Error("Module not found"));
    });

    await expect(universalFetch("https://example.com", {})).rejects.toThrow(
        "Fetch is not available in this environment. If you are using Node.js <18, install 'node-fetch' manually: npm install node-fetch"
    );
  });
});
