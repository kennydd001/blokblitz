import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"]
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: [".trycloudflare.com"]
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    environment: "node",
    globals: true
  }
});


