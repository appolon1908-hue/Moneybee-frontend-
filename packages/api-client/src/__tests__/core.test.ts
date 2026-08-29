import { describe, expect, it } from "vitest"
import { ApiConfigurationError, normalizeApiBaseUrl } from "../core"

describe("normalizeApiBaseUrl", () => {
  it("accepts a valid v2 URL", () => {
    expect(normalizeApiBaseUrl("https://api.moneybeeloan.com/api/v2")).toBe(
      "https://api.moneybeeloan.com/api/v2",
    )
  })

  it("strips trailing slash", () => {
    expect(normalizeApiBaseUrl("https://api.moneybeeloan.com/api/v2/")).toBe(
      "https://api.moneybeeloan.com/api/v2",
    )
  })

  it("rejects non-v2 paths", () => {
    expect(() => normalizeApiBaseUrl("https://api.moneybeeloan.com/api/v1"))
      .toThrow(ApiConfigurationError)
  })

  it("rejects non-HTTP URLs", () => {
    expect(() => normalizeApiBaseUrl("ftp://api.moneybeeloan.com/api/v2"))
      .toThrow(ApiConfigurationError)
  })

  it("rejects bare paths without protocol", () => {
    expect(() => normalizeApiBaseUrl("api.moneybeeloan.com/api/v2"))
      .toThrow(ApiConfigurationError)
  })

  it("accepts localhost for development", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000/api/v2")).toBe(
      "http://localhost:8000/api/v2",
    )
  })
})
