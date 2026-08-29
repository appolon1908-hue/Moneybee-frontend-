export const RETURN_TO_KEY = "moneybee.auth.return_to"
export const ACTIVE_ORGANIZATION_KEY = "moneybee.auth.active_organization"
export const ACCOUNT_BOOTSTRAP_KEY = "moneybee.auth.account_bootstrap"

let activeOrganizationId: string | null = null
let activeOrganizationStorage: Storage | null = null
const activeOrganizationListeners: Array<(id: string | null) => void> = []

function sessionStore(): Storage | null {
  return typeof window !== "undefined" ? window.sessionStorage : null
}

export function getActiveOrganizationId(): string | null {
  const store = sessionStore()
  if (store !== activeOrganizationStorage) {
    activeOrganizationStorage = store
    activeOrganizationId = store?.getItem(ACTIVE_ORGANIZATION_KEY) ?? null
  }
  return activeOrganizationId
}

export function setActiveOrganizationId(id: string | null): void {
  activeOrganizationId = id
  activeOrganizationStorage = sessionStore()
  if (activeOrganizationStorage) {
    if (id) {
      activeOrganizationStorage.setItem(ACTIVE_ORGANIZATION_KEY, id)
    } else {
      activeOrganizationStorage.removeItem(ACTIVE_ORGANIZATION_KEY)
    }
  }
  activeOrganizationListeners.forEach((fn) => fn(id))
}

export function onActiveOrganizationChange(
  fn: (id: string | null) => void,
): () => void {
  activeOrganizationListeners.push(fn)
  return () => {
    const index = activeOrganizationListeners.indexOf(fn)
    if (index >= 0) {
      activeOrganizationListeners.splice(index, 1)
    }
  }
}

export type SessionState =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "expired"
  | "forbidden"
  | "error"

export interface LocalPrincipal {
  user_id: string
  issuer: string
  subject: string
  organization_ids: string[]
  active_organization_id: string | null
  roles: string[]
  permissions: string[]
  membership_types: string[]
  borrower_id: string | null
  lender_id: string | null
  is_active: boolean
}

export interface AccountBootstrapResult {
  created: boolean
  user_id: string
  organization_id: string
  username: string
  email: string
  email_verified: boolean
  membership_type: "BORROWER" | "LENDER" | "MONEYBEE" | "AFFILIATE"
  registration_source: "KEYCLOAK_PASSWORD" | "GOOGLE" | "BROKERED"
  welcome_event_status: "PENDING" | "EXISTING" | "NOT_APPLICABLE"
  request_id: string
}
