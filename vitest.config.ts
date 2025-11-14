import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 100000,
    poolOptions: {
      threads: { execArgv: ["--env-file=.env"] },

      // Or another pool:
      forks: { execArgv: ["--env-file=.env"] },
    },
  },
});
