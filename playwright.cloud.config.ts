import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/api",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8790",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "node scripts/test-cloud.mjs",
    url: "http://127.0.0.1:8790/api/session",
    timeout: 120000,
  },
  reporter: "list",
});
