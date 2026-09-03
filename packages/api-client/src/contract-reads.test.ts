import { describe, expect, it } from "vitest"
import {
  configureAccessTokenProvider,
  configureOrganizationIdProvider,
  getApplicationStatus,
  getEffectivePermissions,
  getOfferDetail,
  listPublicProducts,
} from "./index"


describe("contract readback API", () => {
  it("uses canonical encoded routes and carries authenticated tenant context", async () => {
    configureAccessTokenProvider(async () => "readback-token")
    configureOrganizationIdProvider(() => "organization-1")
    const originalFetch = globalThis.fetch
    const calls: string[] = []

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push(url)
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer readback-token")
      expect(headers.get("X-Organization-ID")).toBe("organization-1")
      expect(headers.get("X-Request-ID")).toBeTruthy()
      expect(headers.get("X-Correlation-ID")).toBeTruthy()

      if (url.endsWith("/me/permissions")) {
        return new Response(JSON.stringify({
          active_organization_id: "organization-1",
          roles: ["borrower"],
          permissions: ["application.read"],
          membership_types: ["BORROWER"],
        }), { status: 200, headers: { "Content-Type": "application/json" } })
      }
      if (url.endsWith("/public/products")) {
        return new Response(JSON.stringify([{ product_type: "WORKING_CAPITAL" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.endsWith("/applications/application%2F1/status")) {
        return new Response(JSON.stringify({
          application_id: "application/1",
          status: "APPLICATION_IN_PROGRESS",
          completion_percentage: 60,
          version: 4,
        }), { status: 200, headers: { "Content-Type": "application/json" } })
      }
      if (url.endsWith("/offers/offer%2F1")) {
        return new Response(JSON.stringify({
          id: "offer/1",
          application_id: "application/1",
          lender_id: "lender-1",
          program_id: null,
          product_type: "WORKING_CAPITAL",
          amount: "25000.00",
          term_months: 12,
          payment_frequency: "MONTHLY",
          payment_amount: "2300.00",
          apr: "10.40",
          factor_rate: null,
          origination_fee: "0.00",
          total_repayment: "27600.00",
          prepayment_terms: null,
          personal_guarantee_required: false,
          collateral_description: null,
          expires_at: null,
          status: "AVAILABLE",
          version: 1,
        }), { status: 200, headers: { "Content-Type": "application/json" } })
      }
      throw new Error(`Unexpected request: ${url}`)
    }) as typeof fetch

    try {
      const permissions = await getEffectivePermissions()
      expect(permissions.permissions).toEqual(["application.read"])

      const products = await listPublicProducts()
      expect(products).toEqual([{ product_type: "WORKING_CAPITAL" }])

      const status = await getApplicationStatus("application/1")
      expect(status.version).toBe(4)

      const offer = await getOfferDetail("offer/1")
      expect(offer.amount).toBe("25000.00")
      expect(calls).toHaveLength(4)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
