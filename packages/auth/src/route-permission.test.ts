import { describe, expect, it } from "vitest"
import { requiredRoutePermission } from "./guards"

describe("requiredRoutePermission", () => {
  it("returns a trimmed route-specific permission", () => {
    expect(requiredRoutePermission({ permission: " compliance.read " }))
      .toBe("compliance.read")
  })

  it("fails closed only for an explicit non-empty permission", () => {
    expect(requiredRoutePermission({})).toBeUndefined()
    expect(requiredRoutePermission({ permission: "" })).toBeUndefined()
    expect(requiredRoutePermission({ permission: 7 })).toBeUndefined()
  })
})
