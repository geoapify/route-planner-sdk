let TEST_API_KEY = "TEST_API_KEY";

try {
    const nodeProcess = (globalThis as any).process;
    const isNode = Boolean(nodeProcess?.versions?.node);

    if (isNode) {
        const req =
            (typeof require === "function" ? require : undefined) ||
            nodeProcess?.mainModule?.require?.bind(nodeProcess.mainModule) ||
            (0, eval)("typeof require !== 'undefined' ? require : undefined");

        if (req) {
            const fs = req("fs");
            const path = req("path");

            const testEnvPath = path.join(nodeProcess.cwd(), "test-env-variables.mjs");
            if (fs.existsSync(testEnvPath)) {
                const content = fs.readFileSync(testEnvPath, "utf8");
                const match = content.match(/const\s+TEST_API_KEY\s*=\s*["'`]([^"'`]+)["'`]/);
                if (match?.[1]) {
                    TEST_API_KEY = match[1];
                }
            }
        }
    }
} catch {
    // Keep the fallback TEST_API_KEY value.
}

export default TEST_API_KEY;
