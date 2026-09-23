import { defineConfig } from "@playwright/test";

// Layout invariants. `npm run test:e2e` builds and serves the site on 3199;
// with a dev server already up, `E2E_URL=http://localhost:3000 npm run
// test:e2e` runs against that instead (next dev allows one instance per
// project, so the runner cannot start its own beside it).
const url = process.env.E2E_URL ?? "http://localhost:3199";

export default defineConfig({
  testDir: "e2e",
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: "npm run build && npx next start -p 3199",
        url,
        reuseExistingServer: true,
        timeout: 180_000,
      },
  use: { baseURL: url },
});
