import { describe, expect, it } from "vitest"
import { MoneyBeeAuthManager } from "./auth-manager"
import { AuthConfigurationError } from "./errors"
import {
  ACTIVE_ORGANIZATION_KEY,
  RETURN_TO_KEY,
} from "./session"

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
    value: {
      location: { origin: "https://app.moneybeeloan.com" },
      sessionStorage: storage,
    },
  })
}

function borrowerOptions() {
  return {
    authority: "https://auth.codestra.co/realms/codestra",
    clientId: "moneybee-borrower",
    apiBaseUrl: "https://api.moneybeeloan.com/api/v2",
    redirectUri: "https://app.moneybeeloan.com/auth/callback",
    postLogoutRedirectUri: "https://app.moneybeeloan.com/auth/login",
    selfRegistrationEnabled: true,
  }
}

function authenticatedUser() {
  return {
    access_token: "borrower-token",
    expired: false,
    profile: { sub: "keycloak-subject-1" },
  }
}

function fakePort(user = authenticatedUser()) {
  let redirectOptions: unknown
  return {
    get redirectOptions() { return redirectOptions },
    port: {
      getUser: async () => user,
      signinRedirect: async (options?: unknown) => { redirectOptions = options },
      signinRedirectCallback: async () => user,
      signinSilent: async () => user,
      signinSilentCallback: async () => undefined,
      signoutRedirect: async () => undefined,
      removeUser: async () => undefined,
    },
  }
}

describe("MoneyBee account lifecycle", () => {
  it("opens Keycloak self-registration only for the borrower portal", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    const fake = fakePort()
    const manager = new MoneyBeeAuthManager(borrowerOptions(), fake.port as never)

    await manager.register("/application")

    expect(storage.getItem(RETURN_TO_KEY)).toBe("/application")
    expect(fake.redirectOptions).toEqual({
      extraQueryParams: { prompt: "create" },
    })

    const lender = new MoneyBeeAuthManager({
      ...borrowerOptions(),
      clientId: "moneybee-lender",
      selfRegistrationEnabled: false,
    }, fakePort().port as never)
    await expect(lender.register()).rejects.toBeInstanceOf(AuthConfigurationError)
  })

  it("bootstraps the verified local borrower identity after the OIDC callback", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    storage.setItem(RETURN_TO_KEY, "/application")
    const fake = fakePort()
    const manager = new MoneyBeeAuthManager(borrowerOptions(), fake.port as never)

    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.moneybeeloan.com/api/v2/auth/bootstrap")
      const headers = new Headers(init?.headers)
      expect(init?.method).toBe("POST")
      expect(headers.get("Authorization")).toBe("Bearer borrower-token")
      expect(headers.get("Idempotency-Key")).toBeTruthy()
      expect(headers.get("X-Request-ID")).toBeTruthy()
      expect(headers.get("X-Correlation-ID")).toBeTruthy()
      return new Response(JSON.stringify({
        created: true,
        user_id: "user-1",
        organization_id: "organization-1",
        username: "borrower",
        email: "borrower@example.test",
        email_verified: true,
        membership_type: "BORROWER",
        registration_source: "KEYCLOAK_PASSWORD",
        welcome_event_status: "PENDING",
        request_id: "request-1",
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch

    try {
      expect(await manager.handleCallback()).toBe("/application")
      expect(storage.getItem(ACTIVE_ORGANIZATION_KEY)).toBe("organization-1")
      expect(storage.getItem(RETURN_TO_KEY)).toBeNull()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("bootstraps existing invited lender identities after the OIDC callback", async () => {
    const storage = memoryStorage()
    installWindow(storage)
    storage.setItem(RETURN_TO_KEY, "/submissions")
    const fake = fakePort({
      access_token: "lender-token",
      expired: false,
      profile: { sub: "lender-subject-1" },
    })
    const manager = new MoneyBeeAuthManager({
      ...borrowerOptions(),
      clientId: "moneybee-lender",
      selfRegistrationEnabled: false,
    }, fake.port as never)

    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.moneybeeloan.com/api/v2/auth/bootstrap")
      const headers = new Headers(init?.headers)
      expect(init?.method).toBe("POST")
      expect(headers.get("Authorization")).toBe("Bearer lender-token")
      expect(headers.get("Idempotency-Key")).toBeTruthy()
      return new Response(JSON.stringify({
        created: false,
        user_id: "lender-user-1",
        organization_id: "lender-org-1",
        username: "lender",
        email: "lender@example.test",
        email_verified: true,
        membership_type: "LENDER",
        registration_source: "KEYCLOAK_PASSWORD",
        welcome_event_status: "EXISTING",
        request_id: "request-lender-1",
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch

    try {
      expect(await manager.handleCallback()).toBe("/submissions")
      expect(storage.getItem(ACTIVE_ORGANIZATION_KEY)).toBe("lender-org-1")
      expect(storage.getItem(RETURN_TO_KEY)).toBeNull()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("starts password change, email verification and recovery in Keycloak", async () => {
    installWindow(memoryStorage())

    const password = fakePort()
    const passwordManager = new MoneyBeeAuthManager(borrowerOptions(), password.port as never)
    await passwordManager.changePassword()
    expect(password.redirectOptions).toEqual({
      extraQueryParams: { kc_action: "UPDATE_PASSWORD" },
    })

    const verification = fakePort()
    const verificationManager = new MoneyBeeAuthManager(
      borrowerOptions(),
      verification.port as never,
    )
    await verificationManager.verifyEmail()
    expect(verification.redirectOptions).toEqual({
      extraQueryParams: { kc_action: "VERIFY_EMAIL" },
    })

    const recovery = fakePort()
    const recoveryManager = new MoneyBeeAuthManager(borrowerOptions(), recovery.port as never)
    await recoveryManager.recoverAccount()
    expect(recovery.redirectOptions).toEqual({
      extraQueryParams: { prompt: "login" },
    })
  })

  it("uses the canonical Keycloak account console", () => {
    installWindow(memoryStorage())
    const manager = new MoneyBeeAuthManager(borrowerOptions(), fakePort().port as never)
    expect(manager.accountConsoleUrl()).toBe(
      "https://auth.codestra.co/realms/codestra/account/",
    )
  })
})
