import { describe, expect, it } from "vitest"
import { routes } from "./router"

function paths(): string[] {
  return routes.map((route) => String(route.path))
}

describe("borrower router", () => {
  it("has no duplicate route paths", () => {
    const seen = paths()
    expect(new Set(seen).size).toBe(seen.length)
  })

  it("redirects the root to the dashboard", () => {
    const root = routes.find((route) => route.path === "/")
    expect(root).toMatchObject({ redirect: "/dashboard" })
  })

  it("exposes every borrower application-flow route", () => {
    expect(paths()).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/workspace",
        "/application",
        "/business",
        "/financials",
        "/owners",
        "/conditions",
        "/offers",
        "/funding",
        "/contracts",
        "/renewals",
        "/documents",
        "/banking",
        "/verification",
        "/profile",
        "/support",
      ]),
    )
  })

  it("marks every /auth/* entry point public so the guard does not lock users out of login", () => {
    const publicAuthActions = [
      "login",
      "register",
      "forgot-password",
      "verify-email",
      "callback",
      "silent-callback",
      "logout",
      "session-expired",
    ]
    for (const action of publicAuthActions) {
      const route = routes.find((candidate) => candidate.meta?.authAction === action)
      expect(route?.meta?.public, `expected /auth ${action} route to be public`).toBe(true)
    }
  })
})
