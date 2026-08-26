<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import {
  submitCallbackRequest,
  submitContactRequest,
  submitDealSubmissionInquiry,
  submitLenderPartnerInquiry,
  submitReferralPartnerInquiry,
  type PublicIntakeAccepted,
} from "@moneybee/api-client"
import {
  PUBLIC_CONSENT_TEXT,
  buildPublicPayload,
  marketingAttribution,
  type PublicFormKind,
  type PublicFormState,
} from "../publicFormPayloads"

const props = withDefaults(defineProps<{
  kind: PublicFormKind
  landingPage: string
  defaultTopic?: string
}>(), { defaultTopic: "Business funding" })

const busy = ref(false)
const error = ref("")
const accepted = ref<PublicIntakeAccepted | null>(null)
const idempotencyKey = ref("")
const state = reactive<PublicFormState>({
  first_name: "",
  last_name: "",
  email: "",
  phone: "+1",
  business_name: "",
  topic: props.defaultTopic,
  message: "",
  preferred_channel: "EITHER",
  preferred_time: "Weekdays, 9 AM–5 PM",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  role: "",
  website: "",
  product_types: "",
  states: "",
  annual_originations: null,
  partner_type: "BROKER",
  estimated_monthly_leads: null,
  requested_amount: 50000,
  monthly_revenue: 50000,
  time_in_business_months: 24,
  industry: "",
  state: "",
  use_of_funds: "Working capital",
  consent: false,
})

watch(state, () => {
  if (!busy.value && !accepted.value) idempotencyKey.value = ""
}, { deep: true })

const title = computed(() => ({
  contact: "Contact MoneyBee",
  callback: "Request a callback",
  lender: "Become a lender partner",
  referral: "Apply as a referral partner",
  deal: "Submit a deal inquiry",
})[props.kind])

const submitLabel = computed(() => ({
  contact: "Send request",
  callback: "Request callback",
  lender: "Send partnership inquiry",
  referral: "Send partner application",
  deal: "Send deal inquiry",
})[props.kind])

async function submit(): Promise<void> {
  busy.value = true
  error.value = ""
  try {
    if (!idempotencyKey.value) idempotencyKey.value = crypto.randomUUID()
    const payload = buildPublicPayload(
      props.kind,
      state,
      marketingAttribution(props.landingPage),
    )
    if (props.kind === "contact") {
      accepted.value = await submitContactRequest(
        payload as Parameters<typeof submitContactRequest>[0],
        idempotencyKey.value,
      )
    } else if (props.kind === "callback") {
      accepted.value = await submitCallbackRequest(
        payload as Parameters<typeof submitCallbackRequest>[0],
        idempotencyKey.value,
      )
    } else if (props.kind === "lender") {
      accepted.value = await submitLenderPartnerInquiry(
        payload as Parameters<typeof submitLenderPartnerInquiry>[0],
        idempotencyKey.value,
      )
    } else if (props.kind === "referral") {
      accepted.value = await submitReferralPartnerInquiry(
        payload as Parameters<typeof submitReferralPartnerInquiry>[0],
        idempotencyKey.value,
      )
    } else {
      accepted.value = await submitDealSubmissionInquiry(
        payload as Parameters<typeof submitDealSubmissionInquiry>[0],
        idempotencyKey.value,
      )
    }
  } catch (value) {
    error.value = value instanceof Error
      ? value.message
      : "Unable to send your request right now."
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="card grid inquiry-form" @submit.prevent="submit" :aria-label="title">
    <template v-if="!accepted">
      <div>
        <span class="eyebrow">SECURE INTAKE</span>
        <h2>{{ title }}</h2>
        <p class="muted">Your request is stored by MoneyBee first, then queued for controlled CRM delivery.</p>
      </div>

      <div class="grid two">
        <label>First name<input v-model.trim="state.first_name" autocomplete="given-name" required /></label>
        <label>Last name<input v-model.trim="state.last_name" autocomplete="family-name" required /></label>
        <label>Email<input v-model.trim="state.email" type="email" autocomplete="email" required /></label>
        <label>Phone
          <input v-model.trim="state.phone" type="tel" autocomplete="tel" :required="props.kind === 'callback' || props.kind === 'deal'" />
        </label>
      </div>

      <label>
        {{ props.kind === 'lender' ? 'Institution name' : props.kind === 'referral' ? 'Company name' : 'Business name' }}
        <input v-model.trim="state.business_name" :required="props.kind === 'lender' || props.kind === 'referral' || props.kind === 'deal'" />
      </label>

      <template v-if="props.kind === 'contact'">
        <label>Topic<input v-model.trim="state.topic" required /></label>
        <label>Preferred response
          <select v-model="state.preferred_channel">
            <option value="EITHER">Email or phone</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </select>
        </label>
      </template>

      <template v-if="props.kind === 'callback'">
        <label>Reason<input v-model.trim="state.topic" required /></label>
        <div class="grid two">
          <label>Preferred time<input v-model.trim="state.preferred_time" required /></label>
          <label>Timezone<input v-model.trim="state.timezone" required /></label>
        </div>
      </template>

      <template v-if="props.kind === 'lender'">
        <div class="grid two">
          <label>Your role<input v-model.trim="state.role" required /></label>
          <label>Website<input v-model.trim="state.website" type="url" placeholder="https://" /></label>
          <label>Products (comma separated)<input v-model.trim="state.product_types" placeholder="Term loan, line of credit" /></label>
          <label>States served<input v-model.trim="state.states" placeholder="FL, NY, TX" /></label>
        </div>
        <label>Annual originations
          <input v-model.number="state.annual_originations" type="number" min="0" />
        </label>
      </template>

      <template v-if="props.kind === 'referral'">
        <div class="grid two">
          <label>Partner type
            <select v-model="state.partner_type">
              <option value="BROKER">Broker</option>
              <option value="REFERRAL_PARTNER">Referral partner</option>
              <option value="ISO">ISO</option>
              <option value="CPA">CPA</option>
              <option value="CONSULTANT">Consultant</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>Website<input v-model.trim="state.website" type="url" placeholder="https://" /></label>
          <label>States served<input v-model.trim="state.states" placeholder="FL, NY, TX" /></label>
          <label>Estimated monthly leads
            <input v-model.number="state.estimated_monthly_leads" type="number" min="0" />
          </label>
        </div>
      </template>

      <template v-if="props.kind === 'deal'">
        <div class="grid two">
          <label>Requested amount<input v-model.number="state.requested_amount" type="number" min="1000" required /></label>
          <label>Monthly revenue<input v-model.number="state.monthly_revenue" type="number" min="0" required /></label>
          <label>Months in business<input v-model.number="state.time_in_business_months" type="number" min="0" required /></label>
          <label>Use of funds<input v-model.trim="state.use_of_funds" required /></label>
          <label>Industry<input v-model.trim="state.industry" /></label>
          <label>State<input v-model.trim="state.state" maxlength="2" placeholder="FL" /></label>
        </div>
        <p class="muted">This creates a MoneyBee intake record only. It does not submit to a live lender.</p>
      </template>

      <label>Message
        <textarea v-model.trim="state.message" rows="5" :required="props.kind === 'contact'"></textarea>
      </label>

      <label class="consent-row">
        <input v-model="state.consent" type="checkbox" required />
        <span>{{ PUBLIC_CONSENT_TEXT }} <a href="/consents-and-disclosures">Review disclosures</a>.</span>
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="busy || !state.consent">
        {{ busy ? "Sending…" : submitLabel }}
      </button>
    </template>

    <div v-else class="success" role="status">
      <h2>Request received</h2>
      <p>Your MoneyBee reference is <strong>{{ accepted.reference }}</strong>.</p>
      <p>Our team can now review the request. No live lender or funding action was triggered.</p>
    </div>
  </form>
</template>
