import { describe, expect, it } from "vitest"
import {
  configureAccessTokenProvider,
  configureOrganizationIdProvider,
  financeApi,
} from "./index"

describe("finance API contract", () => {
  it("propagates selected organization and uses canonical finance paths", async () => {
    configureAccessTokenProvider(async () => "token-finance")
    configureOrganizationIdProvider(() => "11111111-1111-1111-1111-111111111111")
    const originalFetch = globalThis.fetch
    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(input))
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer token-finance")
      expect(headers.get("X-Organization-ID")).toBe("11111111-1111-1111-1111-111111111111")
      if (String(input).endsWith("/finance/accounts")) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } })
      }
      if (String(input).endsWith("/finance/trial-balance")) {
        return new Response(JSON.stringify({
          organization_id: "11111111-1111-1111-1111-111111111111",
          currency: "USD",
          as_of: new Date().toISOString(),
          debit_total: "0.00",
          credit_total: "0.00",
          balanced: true,
          accounts: [],
        }), { status: 200, headers: { "Content-Type": "application/json" } })
      }
      throw new Error(`Unexpected request: ${String(input)}`)
    }) as typeof fetch

    try {
      await financeApi.accounts()
      const trial = await financeApi.trialBalance()
      expect(trial.balanced).toBe(true)
      expect(calls.some((url) => url.endsWith("/finance/accounts"))).toBe(true)
      expect(calls.some((url) => url.endsWith("/finance/trial-balance"))).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
