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
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (String(input).endsWith("/finance/trial-balance?currency=USD")) {
        return new Response(JSON.stringify({
          organization_id: "11111111-1111-1111-1111-111111111111",
          currency: "USD",
          as_of: new Date().toISOString(),
          debit_total: "0.00",
          credit_total: "0.00",
          balanced: true,
          accounts: [],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw new Error(`Unexpected request: ${String(input)}`)
    }) as typeof fetch

    try {
      await financeApi.accounts()
      const trial = await financeApi.trialBalance(undefined, { currency: "USD" })
      expect(trial.balanced).toBe(true)
      expect(calls.some((url) => url.endsWith("/finance/accounts"))).toBe(true)
      expect(calls.some((url) => url.endsWith("/finance/trial-balance?currency=USD"))).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("sends the idempotency key only in the header, never in the body (the backend's JournalEntryCreate forbids extra fields and 422s on a body idempotency_key)", async () => {
    configureAccessTokenProvider(async () => "token-finance")
    configureOrganizationIdProvider(() => "11111111-1111-1111-1111-111111111111")
    const originalFetch = globalThis.fetch
    const key = "journal-idempotency-0001"

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input).endsWith("/finance/journal-entries")).toBe(true)
      expect(init?.method).toBe("POST")
      const headers = new Headers(init?.headers)
      expect(headers.get("Idempotency-Key")).toBe(key)
      expect(headers.get("X-Organization-ID")).toBe("11111111-1111-1111-1111-111111111111")
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      expect(body.idempotency_key).toBeUndefined()
      expect(body.organization_id).toBeUndefined()
      expect(body.source_type).toBe("MANUAL")
      return new Response(JSON.stringify({
        id: "journal-1",
        organization_id: "11111111-1111-1111-1111-111111111111",
        period_id: "period-1",
        entry_number: "JE-1",
        idempotency_key: key,
        source_type: "MANUAL",
        source_id: null,
        description: "Test",
        currency: "USD",
        effective_at: new Date().toISOString(),
        status: "POSTED",
        posted_at: new Date().toISOString(),
        posted_by: "subject",
        reversal_of_id: null,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    try {
      const result = await financeApi.postJournal({
        idempotency_key: key,
        source_type: "MANUAL",
        description: "Test",
        currency: "USD",
        effective_at: new Date().toISOString(),
        postings: [
          { account_id: "account-1", side: "DEBIT", amount: "10.00" },
          { account_id: "account-2", side: "CREDIT", amount: "10.00" },
        ],
      })
      expect(result.idempotency_key).toBe(key)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("connects journal detail to its posting endpoint", async () => {
    configureAccessTokenProvider(async () => "token-finance")
    configureOrganizationIdProvider(() => "11111111-1111-1111-1111-111111111111")
    const originalFetch = globalThis.fetch

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      expect(String(input).endsWith("/finance/journal-entries/journal%2F1/postings")).toBe(true)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    try {
      const postings = await financeApi.journalPostings("journal/1")
      expect(postings).toEqual([])
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
