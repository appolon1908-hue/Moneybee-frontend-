import { describe, expect, it } from "vitest"
import { portalGuardRequirement } from "./portal-config"

describe("borrower portal guard", () => {
  it("scopes the app to the BORROWER membership only", () => {
    expect(portalGuardRequirement).toEqual({ membershipType: "BORROWER" })
  })
})
