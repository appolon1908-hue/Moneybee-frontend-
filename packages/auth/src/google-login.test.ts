import { describe, expect, it } from "vitest"
import { MoneyBeeAuthManager } from "./auth-manager"
import { RETURN_TO_KEY } from "./session"

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

describe("Keycloak-brokered Google login", () => {
  it("uses kc_idp_hint without exposing a Google client secret", async () => {
    const storage = memoryStorage()
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { origin: "https://app.moneybeeloan.com" },
        sessionStorage: storage,
      },
    })

    let redirectOptions: unknown
    const port = {
      getUser: async () => null,
      signinRedirect: async (options?: unknown) => { redirectOptions = options },
      signinRedirectCallback: async () => null,
      signinSilent: async () => null,
      signinSilentCallback: async () => undefined,
      signoutRedirect: async () => undefined,
      removeUser: async () => undefined,
    }
    const manager = new MoneyBeeAuthManager({
      authority: "https://auth.codestra.co/realms/codestra",
      clientId: "moneybee-web",
      apiBaseUrl: "https://api.moneybeeloan.com/api/v2",
      redirectUri: "https://app.moneybeeloan.com/auth/callback",
      postLogoutRedirectUri: "https://app.moneybeeloan.com/auth/login",
      googleIdentityProviderAlias: "google",
      googleLoginEnabled: true,
    }, port as never)

    await manager.loginWithGoogle("/offers")

    expect(storage.getItem(RETURN_TO_KEY)).toBe("/offers")
    expect(redirectOptions).toEqual({
      extraQueryParams: { kc_idp_hint: "google" },
    })
    expect(JSON.stringify(redirectOptions)).not.toContain("client_secret")
  })

  it("fails closed when Google login is disabled", async () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { origin: "https://app.moneybeeloan.com" },
        sessionStorage: memoryStorage(),
      },
    })
    const port = {
      getUser: async () => null,
      signinRedirect: async () => undefined,
      signinRedirectCallback: async () => null,
      signinSilent: async () => null,
      signinSilentCallback: async () => undefined,
      signoutRedirect: async () => undefined,
      removeUser: async () => undefined,
    }
    const manager = new MoneyBeeAuthManager({
      authority: "https://auth.codestra.co/realms/codestra",
      clientId: "moneybee-web",
      apiBaseUrl: "https://api.moneybeeloan.com/api/v2",
      redirectUri: "https://app.moneybeeloan.com/auth/callback",
      postLogoutRedirectUri: "https://app.moneybeeloan.com/auth/login",
      googleIdentityProviderAlias: "google",
      googleLoginEnabled: false,
    }, port as never)

    await expect(manager.loginWithGoogle()).rejects.toThrow(
      "Google login is disabled",
    )
  })
})
