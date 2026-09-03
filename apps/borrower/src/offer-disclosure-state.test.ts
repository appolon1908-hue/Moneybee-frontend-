import { describe, expect, it } from "vitest";
import type { CommercialFinancingDisclosure } from "@moneybee/api-client";
import { disclosureCanBeAccepted } from "./offer-disclosure-state";

function disclosure(
  acknowledgedAt: string | null,
): CommercialFinancingDisclosure {
  return {
    id: "disclosure-1",
    offer_id: "offer-1",
    application_id: "application-1",
    jurisdiction: "NY",
    amount_financed: "25000.50",
    finance_charge: "2500.25",
    total_repayment_amount: "27500.75",
    estimated_apr: "12.50",
    payment_amount: "1145.86",
    payment_frequency: "MONTHLY",
    term_months: 24,
    prepayment_policy: "No penalty",
    disclosure_text: "Reviewed disclosure",
    acknowledged_at: acknowledgedAt,
    acknowledged_by: acknowledgedAt ? "borrower-1" : null,
    created_at: "2026-09-03T00:00:00Z",
  };
}

describe("disclosureCanBeAccepted", () => {
  it("requires recorded acknowledgment before offer acceptance", () => {
    expect(disclosureCanBeAccepted(disclosure(null))).toBe(false);
    expect(
      disclosureCanBeAccepted(disclosure("2026-09-03T00:05:00Z")),
    ).toBe(true);
  });
});
