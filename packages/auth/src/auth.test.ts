import { describe, expect, it } from "vitest"
import { MoneyBeeAuthManager } from "./auth-manager"
import { LocalIdentityError, safeReturnTo } from "./errors"
import { hasMembership, hasPermission, hasRole } from "./permissions"
import {
  ACTIVE_ORGANIZATION_KEY,
  RETURN_TO_KEY,
  type LocalPrincipal,
} from "./session"

const principal: LocalPrincipal = {
  user_id: "user-1",
  issuer: "https://auth.codestra.co/realms/codestra",
  subject: "subject-1",
  organization_ids: ["org-1"],
  active_organization_id: "org-1",
  roles: ["BORROWER_SELF_SERVICE"],
  permissions: ["application.read.own"],
  membership_types: ["BORROWER"],
  borrower_id: "org-1",
  lender_id: null,
  is_active: true,
}

describe("authorization helpers", () => {
  it("fails closed for missing permissions and memberships", () => {
    expect(hasPermission(principal, "application.read.own")).toBe(true)
    expect(hasPermission(principal, "funding.confirm")).toBe(false)
    expect(hasMembership(principal, "BORROWER")).toBe(true)
    expect(hasMembership(principal, "LENDER")).toBe(false)
    expect(hasRole(principal, "BORROWER_SELF_SERVICE")).toBe(true)
  })

  it("rejects disabled principals", () => {
    const disabled = { ...principal, is_active: false }
    expect(hasPermission(disabled, "application.read.own")).toBe(false)
    expect(hasMembership(disabled, "BORROWER")).toBe(false)
  })

  it("does not permit open redirects", () => {
    expect(safeReturnTo("/offers")).toBe("/offers")
    expect(safeReturnTo("//evil.example")).toBe("/dashboard")
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard")
  })
})

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

function installWindow(storage: Storage): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://app.moneybeeloan.com" }, sessionStorage: storage },
  })
}

function fakeOidcManager(user = {
  access_token: "access-token",
  expired: false,
}) {
  const calls = { login: 0, prompt: "", callback: 0, silentCallback: 0, logout: 0, removed: 0 }
  return {
    calls,
    port: {
      getUser: async () => user,
      signinRedirect: async (args?: { prompt?: string }) => {
        calls.login += 1
        calls.prompt = args?.prompt || ""
      },
      signinRedirectCallback: async () => {
        calls.callback += 1
        return user
      },
      signinSilent: async () => user,
      signinSilentCallback: async () => { calls.silentCallback += 1 },
      signoutRedirect: async () => { calls.logout += 1 },
      removeUser: async () => { calls.removed += 1 },
    },
  }
}

const options = {
  authority: "https://auth.codestra.co/realms/codestra",
  clientId: "moneybee-borrower",
  apiBaseUrl: "https://api.moneybeeloan.com/api/v2",
  redirectUri: "https://app.moneybeeloan.com/auth/callback",
  postLogoutRedirectUri: "https://app.moneybeeloan.com/auth/login",
}

describe("OIDC session manager", () => {
  it("supports login, callback account bootstrap, refresh-safe sessions, and logout", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    const fake = fakeOidcManager()
    const manager = new MoneyBeeAuthManager(options, fake.port as never)
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.moneybeeloan.com/api/v2/account/bootstrap")
      expect(init?.method).toBe("POST")
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-token")
      return new Response(JSON.stringify({ created: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch
    try {
      await manager.login("/offers?application=123")
      expect(storage.getItem(RETURN_TO_KEY)).toBe("/offers?application=123")
      expect(fake.calls.login).toBe(1)
      expect(await manager.handleCallback()).toBe("/offers?application=123")
      expect(fake.calls.callback).toBe(1)
      await manager.handleSilentCallback()
      expect(fake.calls.silentCallback).toBe(1)
      expect(await manager.isAuthenticated()).toBe(true)
      expect(await manager.getAccessToken()).toBe("access-token")
      await manager.logout()
      expect(fake.calls.logout).toBe(1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("starts borrower registration with the OIDC prompt=create flow", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    const fake = fakeOidcManager()
    const manager = new MoneyBeeAuthManager(options, fake.port as never)

    await manager.register("/application")
    expect(storage.getItem(RETURN_TO_KEY)).toBe("/application")
    expect(fake.calls.login).toBe(1)
    expect(fake.calls.prompt).toBe("create")
  })

  it("sends tenant selection and parses stable backend identity errors", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    const manager = new MoneyBeeAuthManager(options, fakeOidcManager().port as never)
    manager.selectOrganization("organization-1")
    expect(storage.getItem(ACTIVE_ORGANIZATION_KEY)).toBe("organization-1")

    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("X-Organization-ID")).toBe("organization-1")
      return new Response(JSON.stringify({
        detail: {
          code: "TENANT_ACCESS_DENIED",
          message: "The selected organization is not available.",
        },
      }), { status: 403, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch
    try {
      await manager.getLocalPrincipal()
      throw new Error("Expected local identity resolution to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(LocalIdentityError)
      expect(error).toMatchObject({
        status: 403,
        code: "TENANT_ACCESS_DENIED",
        message: "The selected organization is not available.",
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("recognizes expired sessions", async () => {
    installWindow(memoryStorage())
    const fake = fakeOidcManager({ access_token: "expired", expired: true })
    const manager = new MoneyBeeAuthManager(options, fake.port as never)
    expect(await manager.sessionExpired()).toBe(true)
    expect(await manager.isAuthenticated()).toBe(false)
  })
})
