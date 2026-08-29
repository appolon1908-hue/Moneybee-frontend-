import { api } from "./core"
import { ENDPOINTS } from "./endpoints"

export interface MarketingAttribution {
  landing_page: string
  original_referrer?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  gclid?: string | null
  fbclid?: string | null
  affiliate?: string | null
}

export interface ConsentInput {
  type: string
  document_version: string
  document_hash?: string | null
  accepted: boolean
}

export interface PublicIntakeBase {
  marketing: MarketingAttribution
  consents: ConsentInput[]
  anti_bot_token?: string | null
}

export interface PrequalificationInput extends PublicIntakeBase {
  funding_amount: number
  currency: "USD"
  use_of_funds: string
  time_in_business_months: number
  monthly_revenue: number
  business_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  postal_code: string
}

export interface ContactRequestInput extends PublicIntakeBase {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  business_name?: string | null
  topic: string
  message: string
  preferred_channel: "EMAIL" | "PHONE" | "EITHER"
}

export interface CallbackRequestInput extends PublicIntakeBase {
  first_name: string
  last_name: string
  email: string
  phone: string
  business_name?: string | null
  preferred_time: string
  timezone: string
  reason: string
  message?: string | null
}

export interface LenderPartnerInquiryInput extends PublicIntakeBase {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  institution_name: string
  role: string
  website?: string | null
  product_types: string[]
  states: string[]
  annual_originations?: number | null
  message?: string | null
}

export interface ReferralPartnerInquiryInput extends PublicIntakeBase {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  company_name: string
  partner_type: "BROKER" | "REFERRAL_PARTNER" | "ISO" | "CPA" | "CONSULTANT" | "OTHER"
  website?: string | null
  states: string[]
  estimated_monthly_leads?: number | null
  message?: string | null
}

export interface DealSubmissionInquiryInput extends PublicIntakeBase {
  first_name: string
  last_name: string
  email: string
  phone: string
  business_name: string
  requested_amount: number
  monthly_revenue: number
  time_in_business_months: number
  industry?: string | null
  state?: string | null
  use_of_funds: string
  message?: string | null
}

export interface LeadAccepted {
  lead_id: string
  reference: string
  status: "RECEIVED"
  next_action: { type: string; url: string }
  request_id: string
}

export interface PublicIntakeAccepted {
  intake_id: string
  reference: string
  intake_type: string
  status: "RECEIVED"
  request_id: string
}

function submit<TResponse, TPayload>(
  path: string,
  payload: TPayload,
  idempotencyKey: string,
): Promise<TResponse> {
  return api<TResponse>(path, {
    method: "POST",
    idempotencyKey,
    body: JSON.stringify(payload),
  })
}

export function submitPrequalification(
  payload: PrequalificationInput,
  idempotencyKey: string,
): Promise<LeadAccepted> {
  return submit<LeadAccepted, PrequalificationInput>(ENDPOINTS.public.prequalifications, payload, idempotencyKey)
}

export function submitContactRequest(
  payload: ContactRequestInput,
  idempotencyKey: string,
): Promise<PublicIntakeAccepted> {
  return submit<PublicIntakeAccepted, ContactRequestInput>(ENDPOINTS.public.contactRequests, payload, idempotencyKey)
}

export function submitCallbackRequest(
  payload: CallbackRequestInput,
  idempotencyKey: string,
): Promise<PublicIntakeAccepted> {
  return submit<PublicIntakeAccepted, CallbackRequestInput>(ENDPOINTS.public.callbackRequests, payload, idempotencyKey)
}

export function submitLenderPartnerInquiry(
  payload: LenderPartnerInquiryInput,
  idempotencyKey: string,
): Promise<PublicIntakeAccepted> {
  return submit<PublicIntakeAccepted, LenderPartnerInquiryInput>(ENDPOINTS.public.lenderPartnerInquiries, payload, idempotencyKey)
}

export function submitReferralPartnerInquiry(
  payload: ReferralPartnerInquiryInput,
  idempotencyKey: string,
): Promise<PublicIntakeAccepted> {
  return submit<PublicIntakeAccepted, ReferralPartnerInquiryInput>(ENDPOINTS.public.referralPartnerInquiries, payload, idempotencyKey)
}

export function submitDealSubmissionInquiry(
  payload: DealSubmissionInquiryInput,
  idempotencyKey: string,
): Promise<PublicIntakeAccepted> {
  return submit<PublicIntakeAccepted, DealSubmissionInquiryInput>(ENDPOINTS.public.dealSubmissionInquiries, payload, idempotencyKey)
}
