import {
  UserManager,
  WebStorageStateStore,
  type User,
  type UserManagerSettings,
} from "oidc-client-ts"
import { AuthConfigurationError, LocalIdentityError, safeReturnTo } from "./errors"
import {
  ACCOUNT_BOOTSTRAP_KEY,
  RETURN_TO_KEY,
  getActiveOrganizationId,
  setActiveOrganizationId,
  type AccountBootstrapResult,
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
  googleIdentityProviderAlias?: string
  googleLoginEnabled?: boolean
  selfRegistrationEnabled?: boolean
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

function runtimeFlag(value: unknown): boolean | undefined {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized === "true") return true
  if (normalized === "false") return false
  throw new AuthConfigurationError("Boolean authentication settings must be true or false.")
}

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
  const configuredRegistration = runtimeFlag(
    import.meta.env.VITE_ACCOUNT_SELF_REGISTRATION_ENABLED,
  )
  return {
    authority,
    clientId,
    apiBaseUrl: String(
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v2",
    ).replace(/\/$/, ""),
    redirectUri: `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: `${window.location.origin}/auth/login`,
    silentRedirectUri: `${window.location.origin}/auth/silent-callback`,
    scope: "openid profile email",
    googleIdentityProviderAlias: String(import.meta.env.VITE_GOOGLE_IDP_ALIAS || "google"),
    googleLoginEnabled: String(import.meta.env.VITE_GOOGLE_LOGIN_ENABLED || "true") !== "false",
    selfRegistrationEnabled:
      configuredRegistration ?? clientId.toLowerCase().includes("borrower"),
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

function responseDetail(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.error && typeof payload.error === "object") {
    return payload.error as Record<string, unknown>
  }
  if (payload.detail && typeof payload.detail === "object") {
    return payload.detail as Record<string, unknown>
  }
  return payload
}

export class MoneyBeeAuthManager {
  private principal: LocalPrincipal | null = null
  private principalToken: string | null = null

  constructor(
    private readonly options: AuthManagerOptions,
    private readonly manager: UserManagerPort = new UserManager(oidcSettings(options)),
  ) {}

  private async beginHostedFlow(
    returnTo: string,
    extraQueryParams?: Record<string, string>,
  ): Promise<void> {
    window.sessionStorage.setItem(RETURN_TO_KEY, safeReturnTo(returnTo))
    await this.manager.signinRedirect(
      extraQueryParams ? { extraQueryParams } : undefined,
    )
  }

  async login(returnTo = "/dashboard", identityProvider?: string): Promise<void> {
    await this.beginHostedFlow(
      returnTo,
      identityProvider ? { kc_idp_hint: identityProvider } : undefined,
    )
  }

  async loginWithGoogle(returnTo = "/dashboard"): Promise<void> {
    if (!this.isGoogleLoginEnabled()) {
      throw new AuthConfigurationError("Google login is disabled for this portal.")
    }
    await this.login(returnTo, this.options.googleIdentityProviderAlias || "google")
  }

  async register(returnTo = "/dashboard"): Promise<void> {
    if (!this.isSelfRegistrationEnabled()) {
      throw new AuthConfigurationError(
        "Public registration is available only in the MoneyBee borrower portal.",
      )
    }
    await this.beginHostedFlow(returnTo, { prompt: "create" })
  }

  async recoverAccount(returnTo = "/dashboard"): Promise<void> {
    await this.beginHostedFlow(returnTo, { prompt: "login" })
  }

  async changePassword(returnTo = "/auth/account"): Promise<void> {
    await this.beginHostedFlow(returnTo, { kc_action: "UPDATE_PASSWORD" })
  }

  async verifyEmail(returnTo = "/dashboard"): Promise<void> {
    await this.beginHostedFlow(returnTo, { kc_action: "VERIFY_EMAIL" })
  }

  accountConsoleUrl(): string {
    return `${this.options.authority.replace(/\/$/, "")}/account/`
  }

  isGoogleLoginEnabled(): boolean {
    return this.options.googleLoginEnabled !== false
      && Boolean(this.options.googleIdentityProviderAlias || "google")
  }

  isSelfRegistrationEnabled(): boolean {
    return this.options.selfRegistrationEnabled
      ?? this.options.clientId.toLowerCase().includes("borrower")
  }

  private pendingReturnTo(): string {
    return safeReturnTo(window.sessionStorage.getItem(RETURN_TO_KEY))
  }

  private bootstrapStorageKey(user: User): string {
    const subject = String(user.profile?.sub || "session")
    return `${ACCOUNT_BOOTSTRAP_KEY}.${subject}`
  }

  private async bootstrapLocalAccount(user: User): Promise<AccountBootstrapResult> {
    if (user.expired || !user.access_token) {
      throw new LocalIdentityError(
        "Authentication is required to complete account setup.",
        401,
        "AUTHENTICATION_REQUIRED",
      )
    }
    const storageKey = this.bootstrapStorageKey(user)
    let idempotencyKey = window.sessionStorage.getItem(storageKey)
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID()
      window.sessionStorage.setItem(storageKey, idempotencyKey)
    }
    const requestId = crypto.randomUUID()
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${user.access_token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Request-ID": requestId,
      "X-Correlation-ID": requestId,
    })
    const activeOrganizationId = getActiveOrganizationId()
    if (activeOrganizationId) headers.set("X-Organization-ID", activeOrganizationId)

    const response = await fetch(`${this.options.apiBaseUrl}/auth/bootstrap`, {
      method: "POST",
      headers,
      credentials: "same-origin",
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>
      const detail = responseDetail(payload)
      throw new LocalIdentityError(
        String(detail.message || detail.detail || "MoneyBee account setup could not be completed."),
        response.status,
        String(detail.code || "ACCOUNT_BOOTSTRAP_FAILED"),
      )
    }
    const result = await response.json() as AccountBootstrapResult
    if (!activeOrganizationId && result.organization_id) {
      setActiveOrganizationId(result.organization_id)
    }
    window.sessionStorage.removeItem(storageKey)
    this.clearLocalPrincipal()
    return result
  }

  private async finishAuthenticatedSession(user: User): Promise<string> {
    await this.bootstrapLocalAccount(user)
    const returnTo = this.pendingReturnTo()
    window.sessionStorage.removeItem(RETURN_TO_KEY)
    return returnTo
  }

  async handleCallback(): Promise<string> {
    const user = await this.manager.signinRedirectCallback()
    if (!user || user.expired || !user.access_token) {
      throw new LocalIdentityError(
        "The authentication callback did not create a valid session.",
        401,
        "SESSION_INVALID",
      )
    }
    return this.finishAuthenticatedSession(user)
  }

  async retryAccountSetup(): Promise<string> {
    const user = await this.manager.getUser()
    if (!user || user.expired || !user.access_token) {
      throw new LocalIdentityError(
        "The secure session expired before account setup completed.",
        401,
        "SESSION_INVALID",
      )
    }
    return this.finishAuthenticatedSession(user)
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
      throw new LocalIdentityError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED",
      )
    }
    if (!force && this.principal && this.principalToken === token) return this.principal

    const requestId = crypto.randomUUID()
    const activeOrganizationId = getActiveOrganizationId()
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
      const detail = responseDetail(payload)
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
    setActiveOrganizationId(organizationId || null)
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
