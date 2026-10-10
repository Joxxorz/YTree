import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: [
    {
      command: "java -jar ../backend/target/accounts-0.0.1-SNAPSHOT.jar",
      url: "http://localhost:8080/api/accounts",
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: false,
    },
  ],
});
