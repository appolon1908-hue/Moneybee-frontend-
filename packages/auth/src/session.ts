export const RETURN_TO_KEY = "moneybee.auth.return_to"
export const ACTIVE_ORGANIZATION_KEY = "moneybee.auth.active_organization"

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
