import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: ".env.test", override: true });

export default defineConfig({
  test: {
    env: { DATABASE_URL: process.env.DATABASE_URL ?? "" },
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});