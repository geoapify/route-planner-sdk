import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@sdk": path.resolve(__dirname, "../../src")
    }
  },
  server: {
    port: 5173
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
