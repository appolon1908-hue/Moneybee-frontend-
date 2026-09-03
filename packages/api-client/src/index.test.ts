import { describe, expect, it } from "vitest"
import {
  ApiConfigurationError,
  ApiProblem,
  apiResponse,
  configureAccessTokenProvider,
  configureUnauthorizedHandler,
  money,
  normalizeApiBaseUrl,
  recoveryAction,
} from "./index"

describe("money", () => {
  it("formats USD values without discarding cents", () => {
    expect(money(75000)).toBe("$75,000.00")
    expect(money("25000.50")).toBe("$25,000.50")
  })
})

describe("api client", () => {
  it("accepts only canonical api v2 base URLs", () => {
    expect(normalizeApiBaseUrl("https://api.moneybeeloan.com/api/v2/"))
      .toBe("https://api.moneybeeloan.com/api/v2")
    expect(() => normalizeApiBaseUrl("https://api.moneybeeloan.com/api/v1"))
      .toThrow(ApiConfigurationError)
    expect(() => normalizeApiBaseUrl("/api/v2"))
      .toThrow(ApiConfigurationError)
  })

  it("classifies concurrency, rate-limit, and recoverable server failures", () => {
    expect(recoveryAction(new ApiProblem("stale", 409, "CONCURRENT_MODIFICATION")))
      .toBe("RELOAD_RESOURCE")
    expect(recoveryAction(new ApiProblem("precondition", 428, "PRECONDITION_REQUIRED")))
      .toBe("RELOAD_RESOURCE")
    expect(recoveryAction(new ApiProblem("slow down", 429, "RATE_LIMITED")))
      .toBe("RETRY_AFTER")
    expect(recoveryAction(new ApiProblem("unavailable", 503, "UNAVAILABLE")))
      .toBe("RETRYABLE_FAILURE")
  })

  it("sends authorization, correlation, idempotency, and version headers", async () => {
    configureAccessTokenProvider(async () => "token-1")
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer token-1")
      expect(headers.get("X-Correlation-ID")).toBe("correlation-1")
      expect(headers.get("Idempotency-Key")).toBe("command-1")
      expect(headers.get("If-Match")).toBe('"7"')
      return new Response(JSON.stringify({ id: "offer-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: '"8"' },
      })
    }) as typeof fetch
    try {
      const response = await apiResponse<{id: string}>("/offers/offer-1", {
        correlationId: "correlation-1",
        idempotencyKey: "command-1",
        expectedVersion: 7,
      })
      expect(response.data.id).toBe("offer-1")
      expect(response.etag).toBe('"8"')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("recovers one unauthorized request through the configured session handler", async () => {
    let attempts = 0
    configureAccessTokenProvider(async () => attempts ? "token-2" : "token-1")
    configureUnauthorizedHandler(async () => true)
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      attempts += 1
      return attempts === 1
        ? new Response(JSON.stringify({ code: "AUTHENTICATION_REQUIRED" }), { status: 401 })
        : new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch
    try {
      const response = await apiResponse<{ok: boolean}>("/me")
      expect(response.data.ok).toBe(true)
      expect(attempts).toBe(2)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
