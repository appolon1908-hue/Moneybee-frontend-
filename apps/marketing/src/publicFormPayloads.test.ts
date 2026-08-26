import { describe, expect, it } from "vitest"
import { buildPublicPayload, type PublicFormState } from "./publicFormPayloads"

const state: PublicFormState = {
  first_name: " Ana ",
  last_name: " Diaz ",
  email: "ANA@EXAMPLE.COM",
  phone: "+15555550100",
  business_name: "Honey Retail",
  topic: "Support",
  message: "Please contact me about my request.",
  preferred_channel: "EITHER",
  preferred_time: "Tomorrow",
  timezone: "America/New_York",
  role: "Director",
  website: "https://example.com",
  product_types: "Term loan, Line of credit",
  states: "fl, ny",
  annual_originations: 1000000,
  partner_type: "BROKER",
  estimated_monthly_leads: 12,
  requested_amount: 75000,
  monthly_revenue: 60000,
  time_in_business_months: 36,
  industry: "Retail",
  state: "fl",
  use_of_funds: "Inventory",
  consent: true,
}
const marketing = { landing_page: "test" }

describe("public form payloads", () => {
  it("normalizes common contact fields and consent evidence", () => {
    const payload = buildPublicPayload("contact", state, marketing)
    expect(payload.email).toBe("ana@example.com")
    expect(payload.first_name).toBe("Ana")
    expect(payload.consents[0]).toMatchObject({
      accepted: true,
      document_version: "2026-08-26",
    })
  })

  it("normalizes lender lists and deal state", () => {
    const lender = buildPublicPayload("lender", state, marketing)
    if (!("states" in lender)) throw new Error("Expected lender payload")
    expect(lender.states).toEqual(["FL", "NY"])
    const deal = buildPublicPayload("deal", state, marketing)
    if (!("state" in deal)) throw new Error("Expected deal payload")
    expect(deal.state).toBe("FL")
  })
})
