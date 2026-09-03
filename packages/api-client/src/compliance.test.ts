import { describe, expect, it } from "vitest"
import {
  acknowledgeBorrowerCommercialFinancingDisclosure,
  configureAccessTokenProvider,
  configureOrganizationIdProvider,
  generateCommissionTaxRecords,
  listCommissionTaxRecords,
  recordCommissionTaxFiling,
  setCommissionTaxRecordTin,
} from "./index"

const taxRecord = {
  id: "tax-record-1",
  recipient_type: "BROKER",
  recipient_reference: "broker-1",
  recipient_name: "Casey Broker",
  tax_year: 2029,
  total_amount: "900.00",
  commission_count: 2,
  requires_1099: true,
  tin_present: true,
  filed_at: null,
  filing_reference: null,
}

describe("compliance API contract", () => {
  it("uses canonical paginated filters and preserves selected organization", async () => {
    configureAccessTokenProvider(async () => "token-compliance")
    configureOrganizationIdProvider(() => "organization-1")
    const originalFetch = globalThis.fetch

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      expect(url.endsWith(
        "/admin/compliance/commission-tax-records?tax_year=2029&requires_1099=true&tin_present=false&limit=25&offset=50",
      )).toBe(true)
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer token-compliance")
      expect(headers.get("X-Organization-ID")).toBe("organization-1")
      return new Response(JSON.stringify({
        items: [],
        total: 0,
        limit: 25,
        offset: 50,
        has_more: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    try {
      const page = await listCommissionTaxRecords({
        tax_year: 2029,
        requires_1099: true,
        tin_present: false,
        limit: 25,
        offset: 50,
      })
      expect(page.has_more).toBe(false)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("sends idempotency keys and never requires a client-supplied actor", async () => {
    configureAccessTokenProvider(async () => "token-compliance")
    configureOrganizationIdProvider(() => "organization-1")
    const originalFetch = globalThis.fetch
    const calls: string[] = []

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push(url)
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer token-compliance")

      if (url.endsWith("/admin/compliance/commission-tax-records/generate?tax_year=2029")) {
        expect(init?.method).toBe("POST")
        expect(headers.get("Idempotency-Key")).toBe("generate-key-0001")
        expect(init?.body).toBeUndefined()
        return new Response(JSON.stringify([taxRecord]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.endsWith("/admin/compliance/commission-tax-records/tax-record-1/tin")) {
        expect(init?.method).toBe("PATCH")
        expect(JSON.parse(String(init?.body))).toEqual({
          recipient_name: "Casey Broker",
          tin: "12-3456789",
        })
        return new Response(JSON.stringify(taxRecord), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.endsWith("/admin/compliance/commission-tax-records/tax-record-1/filing")) {
        expect(init?.method).toBe("PATCH")
        expect(headers.get("Idempotency-Key")).toBe("filing-key-0001")
        return new Response(JSON.stringify({
          ...taxRecord,
          filed_at: "2029-01-31T12:00:00Z",
          filing_reference: "IRS-TEST-1",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.endsWith(
        "/borrower/offers/offer%2F1/commercial-financing-disclosure/acknowledge",
      )) {
        expect(init?.method).toBe("POST")
        expect(headers.get("Idempotency-Key")).toBe("disclosure-key-0001")
        expect(init?.body).toBeUndefined()
        return new Response(JSON.stringify({
          id: "disclosure-1",
          offer_id: "offer/1",
          application_id: "application-1",
          jurisdiction: "FL",
          amount_financed: "25000.00",
          finance_charge: "2600.00",
          total_repayment_amount: "27600.00",
          estimated_apr: "10.4000",
          payment_amount: "2300.00",
          payment_frequency: "MONTHLY",
          term_months: 12,
          prepayment_policy: "No prepayment penalty.",
          disclosure_text: "Disclosure",
          acknowledged_at: "2029-01-01T00:00:00Z",
          acknowledged_by: "authenticated-subject",
          created_at: "2029-01-01T00:00:00Z",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    }) as typeof fetch

    try {
      const generated = await generateCommissionTaxRecords(2029, "generate-key-0001")
      expect(generated[0]?.tin_present).toBe(true)

      const updated = await setCommissionTaxRecordTin("tax-record-1", {
        recipient_name: "Casey Broker",
        tin: "12-3456789",
      })
      expect("tin" in updated).toBe(false)

      const filed = await recordCommissionTaxFiling(
        "tax-record-1",
        { filing_reference: "IRS-TEST-1" },
        "filing-key-0001",
      )
      expect(filed.filing_reference).toBe("IRS-TEST-1")

      const disclosure = await acknowledgeBorrowerCommercialFinancingDisclosure(
        "offer/1",
        "disclosure-key-0001",
      )
      expect(disclosure.acknowledged_by).toBe("authenticated-subject")
      expect(calls).toHaveLength(4)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
