import { describe, expect, it } from "vitest"
import { portalGuardRequirement } from "./portal-config"

describe("admin portal guard", () => {
  it("requires MONEYBEE membership plus an explicit capability.read permission", () => {
    expect(portalGuardRequirement).toEqual({
      membershipType: "MONEYBEE",
      permission: "capability.read",
    })
  })
})
