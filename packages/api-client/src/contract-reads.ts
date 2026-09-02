import { api } from "./core"
import { ENDPOINTS } from "./endpoints"

export interface EffectivePermissions {
  active_organization_id: string | null
  roles: string[]
  permissions: string[]
  membership_types: string[]
}

export interface PublicProduct {
  product_type: string
}

export interface ApplicationStatusReadback {
  application_id: string
  status: string
  completion_percentage: number
  version: number
}

export interface OfferDetail {
  id: string
  application_id: string
  lender_id: string
  program_id: string | null
  product_type: string
  amount: string
  term_months: number
  payment_frequency: string
  payment_amount: string
  apr: string | null
  factor_rate: string | null
  origination_fee: string
  total_repayment: string | null
  prepayment_terms: string | null
  personal_guarantee_required: boolean
  collateral_description: string | null
  expires_at: string | null
  status: string
  version: number
}

export function getEffectivePermissions(): Promise<EffectivePermissions> {
  return api<EffectivePermissions>(ENDPOINTS.identity.permissions)
}

export function listPublicProducts(): Promise<PublicProduct[]> {
  return api<PublicProduct[]>(ENDPOINTS.public.products)
}

export function getApplicationStatus(
  applicationId: string,
): Promise<ApplicationStatusReadback> {
  return api<ApplicationStatusReadback>(ENDPOINTS.applications.status(applicationId))
}

export function getOfferDetail(offerId: string): Promise<OfferDetail> {
  return api<OfferDetail>(ENDPOINTS.offers.item(offerId))
}
