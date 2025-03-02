export async function universalFetch(url: string, options: RequestInit): Promise<Response> {
  if (typeof fetch !== "undefined") {
    // Browser & Node.js 18+ (native fetch support)
    return fetch(url, options);
  } else {
    // Node.js <18 (dynamically load node-fetch if available)
    try {
      const fetchModule = await import("node-fetch");
      const nodeFetch = fetchModule.default as unknown as typeof fetch;
      return nodeFetch(url, options) as unknown as Response;
    } catch (error) {
      throw new Error(
        "Fetch is not available in this environment. If you are using Node.js <18, install 'node-fetch' manually: npm install node-fetch"
      );
    }
  }
}
