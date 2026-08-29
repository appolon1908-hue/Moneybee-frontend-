import { describe, expect, it } from "vitest"
import { routes } from "./router"

function paths(): string[] {
  return routes.map((route) => String(route.path))
}

describe("lender router", () => {
  it("has no duplicate route paths", () => {
    const seen = paths()
    expect(new Set(seen).size).toBe(seen.length)
  })

  it("redirects the root to the dashboard", () => {
    const root = routes.find((route) => route.path === "/")
    expect(root).toMatchObject({ redirect: "/dashboard" })
  })

  it("exposes every lender workspace route", () => {
    expect(paths()).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/workspace",
        "/applications",
        "/underwriting",
        "/conditions",
        "/programs",
        "/offers",
        "/funded-deals",
        "/reports",
        "/settings",
      ]),
    )
  })

  it("marks every /auth/* entry point public so the guard does not lock users out of login", () => {
    const publicAuthActions = ["login", "callback", "silent-callback", "logout", "session-expired"]
    for (const action of publicAuthActions) {
      const route = routes.find((candidate) => candidate.meta?.authAction === action)
      expect(route?.meta?.public, `expected /auth ${action} route to be public`).toBe(true)
    }
  })
})
