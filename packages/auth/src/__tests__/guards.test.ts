import { describe, expect, it } from "vitest"
import { safeReturnTo } from "../errors"
import { hasMembership, hasPermission, hasRole } from "../permissions"
import type { LocalPrincipal } from "../session"

describe("safeReturnTo", () => {
  it("returns a relative path unchanged", () => {
    expect(safeReturnTo("/dashboard")).toBe("/dashboard")
  })

  it("returns fallback for empty string", () => {
    expect(safeReturnTo("")).toBe("/dashboard")
  })

  it("blocks protocol-relative URLs", () => {
    expect(safeReturnTo("//evil.com")).toBe("/dashboard")
  })

  it("blocks absolute http URLs", () => {
    expect(safeReturnTo("http://evil.com/steal")).toBe("/dashboard")
  })

  it("blocks absolute https URLs", () => {
    expect(safeReturnTo("https://evil.com")).toBe("/dashboard")
  })

  it("uses custom fallback", () => {
    expect(safeReturnTo("", "/home")).toBe("/home")
  })

  it("accepts deeply nested relative paths", () => {
    expect(safeReturnTo("/app/loans/123/review")).toBe("/app/loans/123/review")
  })

  it("rejects non-string values", () => {
    expect(safeReturnTo(null)).toBe("/dashboard")
    expect(safeReturnTo(undefined)).toBe("/dashboard")
    expect(safeReturnTo(42)).toBe("/dashboard")
  })
})

const activePrincipal = (
  overrides: Partial<LocalPrincipal> = {},
): LocalPrincipal => ({
  user_id: "u1",
  issuer: "https://auth.codestra.co/realms/codestra",
  subject: "sub1",
  organization_ids: ["org1"],
  active_organization_id: "org1",
  roles: ["user"],
  permissions: ["application.read"],
  membership_types: ["BORROWER"],
  borrower_id: "b1",
  lender_id: null,
  is_active: true,
  ...overrides,
})

describe("hasPermission", () => {
  it("returns true when principal has the permission", () => {
    expect(hasPermission(activePrincipal(), "application.read")).toBe(true)
  })

  it("returns false when permission is absent", () => {
    expect(hasPermission(activePrincipal(), "admin.write")).toBe(false)
  })

  it("returns false when principal is null", () => {
    expect(hasPermission(null, "application.read")).toBe(false)
  })

  it("returns false when principal is inactive", () => {
    expect(hasPermission(activePrincipal({ is_active: false }), "application.read")).toBe(false)
  })

  it("wildcard permission grants everything", () => {
    const principal = activePrincipal({ permissions: ["*"] })
    expect(hasPermission(principal, "anything.at.all")).toBe(true)
  })
})

describe("hasMembership", () => {
  it("returns true for matching membership type", () => {
    expect(hasMembership(activePrincipal(), "BORROWER")).toBe(true)
  })

  it("returns false for non-matching type", () => {
    expect(hasMembership(activePrincipal(), "LENDER")).toBe(false)
  })

  it("returns false for null principal", () => {
    expect(hasMembership(null, "BORROWER")).toBe(false)
  })

  it("MONEYBEE admin membership works", () => {
    const principal = activePrincipal({ membership_types: ["MONEYBEE"] })
    expect(hasMembership(principal, "MONEYBEE")).toBe(true)
    expect(hasMembership(principal, "BORROWER")).toBe(false)
  })
})

describe("hasRole", () => {
  it("returns true when role matches", () => {
    expect(hasRole(activePrincipal(), "user")).toBe(true)
  })

  it("returns false for missing role", () => {
    expect(hasRole(activePrincipal(), "superadmin")).toBe(false)
  })

  it("returns false for null principal", () => {
    expect(hasRole(null, "user")).toBe(false)
  })
})
