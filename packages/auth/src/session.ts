export const RETURN_TO_KEY = "moneybee.auth.return_to"
export const ACTIVE_ORGANIZATION_KEY = "moneybee.auth.active_organization"
export const ACCOUNT_BOOTSTRAP_KEY = "moneybee.auth.account_bootstrap"

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
