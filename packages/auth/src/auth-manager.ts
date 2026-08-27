import {
  UserManager,
  WebStorageStateStore,
  type User,
  type UserManagerSettings,
} from "oidc-client-ts"
import { AuthConfigurationError, LocalIdentityError, safeReturnTo } from "./errors"
import {
  ACTIVE_ORGANIZATION_KEY,
  RETURN_TO_KEY,
  type LocalPrincipal,
} from "./session"

export interface AuthManagerOptions {
  authority: string
  clientId: string
  apiBaseUrl: string
  redirectUri: string
  postLogoutRedirectUri: string
  silentRedirectUri?: string
  scope?: string
}

type UserManagerPort = Pick<
  UserManager,
  | "getUser"
  | "signinRedirect"
  | "signinRedirectCallback"
  | "signinSilent"
  | "signinSilentCallback"
  | "signoutRedirect"
  | "removeUser"
>

function runtimeOptions(): AuthManagerOptions {
  if (typeof window === "undefined") {
    throw new AuthConfigurationError("OIDC authentication requires a browser runtime.")
  }
  const authority = String(import.meta.env.VITE_OIDC_AUTHORITY || "").replace(/\/$/, "")
  const clientId = String(import.meta.env.VITE_OIDC_CLIENT_ID || "")
  if (authority !== "https://auth.codestra.co/realms/codestra") {
    throw new AuthConfigurationError("The canonical MoneyBee OIDC authority is required.")
  }
  if (!clientId) {
    throw new AuthConfigurationError("VITE_OIDC_CLIENT_ID is required.")
  }
  return {
    authority,
    clientId,
    apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v2").replace(/\/$/, ""),
    redirectUri: `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: `${window.location.origin}/auth/login`,
    silentRedirectUri: `${window.location.origin}/auth/silent-callback`,
    scope: "openid profile email",
  }
}

function oidcSettings(options: AuthManagerOptions): UserManagerSettings {
  if (typeof window === "undefined") {
    throw new AuthConfigurationError("OIDC authentication requires session storage.")
  }
  const store = new WebStorageStateStore({ store: window.sessionStorage })
  return {
    authority: options.authority,
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    post_logout_redirect_uri: options.postLogoutRedirectUri,
    silent_redirect_uri: options.silentRedirectUri,
    response_type: "code",
    scope: options.scope || "openid profile email",
    automaticSilentRenew: true,
    monitorSession: true,
    userStore: store,
    stateStore: store,
  }
}

export class MoneyBeeAuthManager {
  private principal: LocalPrincipal | null = null
  private principalToken: string | null = null

  constructor(
    private readonly options: AuthManagerOptions,
    private readonly manager: UserManagerPort = new UserManager(oidcSettings(options)),
  ) {}

  canSelfRegister(): boolean {
    return this.options.clientId === "moneybee-borrower"
  }

  async login(returnTo = "/dashboard"): Promise<void> {
    window.sessionStorage.setItem(RETURN_TO_KEY, safeReturnTo(returnTo))
    await this.manager.signinRedirect()
  }

  async register(returnTo = "/dashboard"): Promise<void> {
    if (!this.canSelfRegister()) {
      throw new AuthConfigurationError("Public registration is available only for the borrower portal.")
    }
    window.sessionStorage.setItem(RETURN_TO_KEY, safeReturnTo(returnTo))
    await this.manager.signinRedirect({ prompt: "create" })
  }

  private async bootstrapBorrowerAccount(accessToken: string): Promise<void> {
    if (this.options.clientId !== "moneybee-borrower") return
    const requestId = crypto.randomUUID()
    const response = await fetch(`${this.options.apiBaseUrl}/account/bootstrap`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": requestId,
        "X-Correlation-ID": requestId,
      },
      credentials: "same-origin",
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>
      const detail = payload.detail && typeof payload.detail === "object"
        ? payload.detail as Record<string, unknown>
        : payload
      throw new LocalIdentityError(
        String(detail.message || detail.detail || "MoneyBee account provisioning could not be completed."),
        response.status,
        String(detail.code || "ACCOUNT_BOOTSTRAP_FAILED"),
      )
    }
  }

  async handleCallback(): Promise<string> {
    const user = await this.manager.signinRedirectCallback()
    if (!user || user.expired || !user.access_token) {
      throw new LocalIdentityError("The authentication callback did not create a valid session.", 401, "SESSION_INVALID")
    }
    await this.bootstrapBorrowerAccount(user.access_token)
    this.clearLocalPrincipal()
    const returnTo = safeReturnTo(window.sessionStorage.getItem(RETURN_TO_KEY))
    window.sessionStorage.removeItem(RETURN_TO_KEY)
    return returnTo
  }

  async handleSilentCallback(): Promise<void> {
    await this.manager.signinSilentCallback()
    this.clearLocalPrincipal()
  }

  async logout(): Promise<void> {
    this.clearLocalPrincipal()
    await this.manager.signoutRedirect()
  }

  async getUser(): Promise<User | null> {
    return this.manager.getUser()
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.manager.getUser()
    return Boolean(user && !user.expired && user.access_token)
  }

  async sessionExpired(): Promise<boolean> {
    const user = await this.manager.getUser()
    return Boolean(user?.expired)
  }

  async getAccessToken(): Promise<string | null> {
    const user = await this.manager.getUser()
    if (user && !user.expired && user.access_token) return user.access_token
    const refreshed = await this.refreshSession()
    return refreshed?.access_token || null
  }

  async refreshSession(): Promise<User | null> {
    try {
      const user = await this.manager.signinSilent()
      if (!user || user.expired || !user.access_token) return null
      this.clearLocalPrincipal()
      return user
    } catch {
      this.clearLocalPrincipal()
      await this.manager.removeUser()
      return null
    }
  }

  async getLocalPrincipal(force = false): Promise<LocalPrincipal> {
    const token = await this.getAccessToken()
    if (!token) {
      throw new LocalIdentityError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED")
    }
    if (!force && this.principal && this.principalToken === token) return this.principal

    const requestId = crypto.randomUUID()
    const activeOrganizationId = window.sessionStorage.getItem(ACTIVE_ORGANIZATION_KEY)
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Request-ID": requestId,
      "X-Correlation-ID": requestId,
    })
    if (activeOrganizationId) headers.set("X-Organization-ID", activeOrganizationId)
    const response = await fetch(`${this.options.apiBaseUrl}/me`, {
      headers,
      credentials: "same-origin",
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>
      const detail = payload.error && typeof payload.error === "object"
        ? payload.error as Record<string, unknown>
        : payload.detail && typeof payload.detail === "object"
          ? payload.detail as Record<string, unknown>
          : payload
      throw new LocalIdentityError(
        String(detail.message || detail.detail || "Local MoneyBee identity could not be resolved."),
        response.status,
        String(
          detail.code
          || (response.status === 401 ? "IDENTITY_NOT_BOUND" : "RESOURCE_ACCESS_DENIED"),
        ),
      )
    }
    const principal = await response.json() as LocalPrincipal
    if (!principal.is_active) {
      throw new LocalIdentityError("The local MoneyBee user is disabled.", 403, "USER_DISABLED")
    }
    this.principal = principal
    this.principalToken = token
    return principal
  }

  selectOrganization(organizationId: string): void {
    if (!organizationId) {
      window.sessionStorage.removeItem(ACTIVE_ORGANIZATION_KEY)
    } else {
      window.sessionStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId)
    }
    this.clearLocalPrincipal()
  }

  clearLocalPrincipal(): void {
    this.principal = null
    this.principalToken = null
  }
}

export function createAuthManager(options: AuthManagerOptions = runtimeOptions()): MoneyBeeAuthManager {
  return new MoneyBeeAuthManager(options)
}
