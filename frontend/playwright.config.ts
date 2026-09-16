import { defineConfig } from "@playwright/test";
import path from "node:path";

/**
 * Runs the repository-level deterministic browser journeys using the frontend
 * package's tracked Playwright version and a separately managed browser image.
 */
export default defineConfig({
  testDir: path.resolve(__dirname, "../tests/e2e"),
  // The read-only Compose runner supplies a writable temporary directory.
  outputDir:
    process.env.PLAYWRIGHT_OUTPUT_DIR ?? path.resolve(__dirname, "test-results/e2e"),
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
