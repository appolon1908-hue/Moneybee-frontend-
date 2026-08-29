import { defineConfig, devices } from "@playwright/test"

const marketingBaseUrl = process.env.MONEYBEE_MARKETING_URL || "http://127.0.0.1:4173"
const borrowerBaseUrl = process.env.MONEYBEE_BORROWER_URL || "http://127.0.0.1:4174"
const lenderBaseUrl = process.env.MONEYBEE_LENDER_URL || "http://127.0.0.1:4175"
const adminBaseUrl = process.env.MONEYBEE_ADMIN_URL || "http://127.0.0.1:4176"
const apiBaseUrl = process.env.MONEYBEE_API_URL || "http://127.0.0.1:8000"

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "test-results/launch-e2e.json" }]],
  use: {
    baseURL: marketingBaseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        extraHTTPHeaders: {
          "X-MoneyBee-E2E": "launch",
        },
      },
      metadata: {
        marketingBaseUrl,
        borrowerBaseUrl,
        lenderBaseUrl,
        adminBaseUrl,
        apiBaseUrl,
      },
    },
    {
      name: "mobile-chrome",
      use: devices["Pixel 7"],
      metadata: {
        marketingBaseUrl,
        borrowerBaseUrl,
        lenderBaseUrl,
        adminBaseUrl,
        apiBaseUrl,
      },
    },
  ],
})
