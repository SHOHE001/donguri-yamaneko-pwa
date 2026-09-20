import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 2,
  use: { baseURL: "http://127.0.0.1:4179", serviceWorkers: "block" },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: "python3 -m http.server 4179 --bind 127.0.0.1",
    url: "http://127.0.0.1:4179",
    stderr: "ignore",
  },
});
