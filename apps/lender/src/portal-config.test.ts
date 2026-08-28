import { describe, expect, it } from "vitest"
import { portalGuardRequirement } from "./portal-config"

describe("lender portal guard", () => {
  it("scopes the app to the LENDER membership only", () => {
    expect(portalGuardRequirement).toEqual({ membershipType: "LENDER" })
  })
})
