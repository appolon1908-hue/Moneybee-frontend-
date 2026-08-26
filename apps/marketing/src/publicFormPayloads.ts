import type {
  CallbackRequestInput,
  ConsentInput,
  ContactRequestInput,
  DealSubmissionInquiryInput,
  LenderPartnerInquiryInput,
  MarketingAttribution,
  ReferralPartnerInquiryInput,
} from "@moneybee/api-client"

export type PublicFormKind = "contact" | "callback" | "lender" | "referral" | "deal"

export const PUBLIC_CONSENT_TEXT =
  "I agree to MoneyBee's electronic communications, privacy notice, and authorization to contact me about this request."
export const PUBLIC_CONSENT_VERSION = "2026-08-26"
export const PUBLIC_CONSENT_HASH =
  "0ee98c00b7f6817fa8094e8081352c453e63ad829ba6731fdaa3905787b12d8a"

export interface PublicFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  business_name: string
  topic: string
  message: string
  preferred_channel: "EMAIL" | "PHONE" | "EITHER"
  preferred_time: string
  timezone: string
  role: string
  website: string
  product_types: string
  states: string
  annual_originations: number | null
  partner_type: "BROKER" | "REFERRAL_PARTNER" | "ISO" | "CPA" | "CONSULTANT" | "OTHER"
  estimated_monthly_leads: number | null
  requested_amount: number
  monthly_revenue: number
  time_in_business_months: number
  industry: string
  state: string
  use_of_funds: string
  consent: boolean
}

function list(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function consent(state: PublicFormState): ConsentInput[] {
  return [{
    type: "ELECTRONIC_COMMUNICATIONS",
    document_version: PUBLIC_CONSENT_VERSION,
    document_hash: PUBLIC_CONSENT_HASH,
    accepted: state.consent,
  }]
}

export function buildPublicPayload(
  kind: PublicFormKind,
  state: PublicFormState,
  marketing: MarketingAttribution,
): ContactRequestInput | CallbackRequestInput | LenderPartnerInquiryInput | ReferralPartnerInquiryInput | DealSubmissionInquiryInput {
  const shared = {
    first_name: state.first_name.trim(),
    last_name: state.last_name.trim(),
    email: state.email.trim().toLowerCase(),
    phone: state.phone.trim() || null,
    marketing,
    consents: consent(state),
  }
  if (kind === "contact") {
    return {
      ...shared,
      business_name: state.business_name.trim() || null,
      topic: state.topic.trim(),
      message: state.message.trim(),
      preferred_channel: state.preferred_channel,
    }
  }
  if (kind === "callback") {
    return {
      ...shared,
      phone: state.phone.trim(),
      business_name: state.business_name.trim() || null,
      preferred_time: state.preferred_time.trim(),
      timezone: state.timezone.trim(),
      reason: state.topic.trim(),
      message: state.message.trim() || null,
    }
  }
  if (kind === "lender") {
    return {
      ...shared,
      institution_name: state.business_name.trim(),
      role: state.role.trim(),
      website: state.website.trim() || null,
      product_types: list(state.product_types),
      states: list(state.states).map((item) => item.toUpperCase()),
      annual_originations: state.annual_originations,
      message: state.message.trim() || null,
    }
  }
  if (kind === "referral") {
    return {
      ...shared,
      company_name: state.business_name.trim(),
      partner_type: state.partner_type,
      website: state.website.trim() || null,
      states: list(state.states).map((item) => item.toUpperCase()),
      estimated_monthly_leads: state.estimated_monthly_leads,
      message: state.message.trim() || null,
    }
  }
  return {
    ...shared,
    phone: state.phone.trim(),
    business_name: state.business_name.trim(),
    requested_amount: state.requested_amount,
    monthly_revenue: state.monthly_revenue,
    time_in_business_months: state.time_in_business_months,
    industry: state.industry.trim() || null,
    state: state.state.trim().toUpperCase() || null,
    use_of_funds: state.use_of_funds.trim(),
    message: state.message.trim() || null,
  }
}

export function marketingAttribution(landingPage: string): MarketingAttribution {
  const params = new URLSearchParams(globalThis.location?.search || "")
  return {
    landing_page: landingPage,
    original_referrer: document.referrer || null,
    referrer: document.referrer || null,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    affiliate: params.get("affiliate"),
  }
}
