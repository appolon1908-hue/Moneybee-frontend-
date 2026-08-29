<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { submitPrequalification } from "@moneybee/api-client"
import { PUBLIC_CONSENT_HASH, PUBLIC_CONSENT_TEXT, PUBLIC_CONSENT_VERSION } from "../publicFormPayloads"

const props = defineProps<{landingPage: string}>()
const step = ref(1)
const busy = ref(false)
const error = ref("")
const accepted = ref<{reference: string; next_action: {url: string}} | null>(null)
const idempotencyKey = ref("")
const stepError = ref("")
const form = reactive({
  funding_amount: 50000,
  use_of_funds: "WORKING_CAPITAL",
  time_in_business_months: 24,
  monthly_revenue: 50000,
  business_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "+1",
  postal_code: "",
  consent: false,
})
const progress = computed(() => step.value * 20)
const estimatedRange = computed(() => {
  const revenue = Number(form.monthly_revenue || 0)
  const requested = Number(form.funding_amount || 0)
  const conservative = Math.max(1000, Math.min(requested, Math.round(revenue * 0.75)))
  const expanded = Math.max(conservative, Math.min(requested, Math.round(revenue * 1.5)))
  return `$${conservative.toLocaleString()} - $${expanded.toLocaleString()}`
})
const stepTitle = computed(() => [
  "Funding target",
  "Purpose",
  "Business profile",
  "Business details",
  "Contact and consent",
][step.value - 1])
const params = new URLSearchParams(location.search)

watch(form, () => {
  if (!busy.value && !accepted.value) idempotencyKey.value = ""
  stepError.value = ""
}, { deep: true })

function canContinue(): boolean {
  if (step.value === 1) return form.funding_amount >= 1000
  if (step.value === 2) return Boolean(form.use_of_funds)
  if (step.value === 3) {
    return form.time_in_business_months >= 0 && form.monthly_revenue >= 0
  }
  if (step.value === 4) {
    return Boolean(form.business_name.trim()) && Boolean(form.postal_code.trim())
  }
  return Boolean(
    form.first_name.trim()
    && form.last_name.trim()
    && form.email.trim()
    && form.phone.trim()
    && form.consent,
  )
}

function nextStep(): void {
  if (!canContinue()) {
    stepError.value = "Complete this step before continuing."
    return
  }
  step.value += 1
}

async function submit() {
  if (!canContinue()) {
    stepError.value = "Complete contact and consent before submitting."
    return
  }
  busy.value = true
  error.value = ""
  try {
    if (!idempotencyKey.value) idempotencyKey.value = crypto.randomUUID()
    accepted.value = await submitPrequalification({
      ...form,
      currency: "USD",
      consents: [{
        type: "ELECTRONIC_COMMUNICATIONS",
        document_version: PUBLIC_CONSENT_VERSION,
        document_hash: PUBLIC_CONSENT_HASH,
        accepted: form.consent,
      }],
      marketing: {
        landing_page: props.landingPage,
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
      },
    }, idempotencyKey.value)
  } catch (value) {
    error.value = value instanceof Error ? value.message : "Unable to submit right now."
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="card grid prequal-card" @submit.prevent="submit" aria-label="Business funding prequalification">
    <div>
      <strong>Step {{ step }} of 5: {{ stepTitle }}</strong>
      <div class="progress"><span :style="{width: progress + '%'}"></span></div>
    </div>

    <template v-if="!accepted">
      <div v-if="step === 1" class="grid">
        <label>Funding amount
          <input v-model.number="form.funding_amount" type="number" min="1000" step="1000" required />
        </label>
        <input
          v-model.number="form.funding_amount"
          type="range"
          min="5000"
          max="500000"
          step="5000"
          aria-label="Funding amount slider"
        />
        <p class="muted">Popular requests start at $25,000 to $150,000. Final eligibility depends on review.</p>
      </div>
      <label v-if="step === 2">Use of funds
        <select v-model="form.use_of_funds">
          <option value="WORKING_CAPITAL">Working capital</option>
          <option value="EQUIPMENT">Equipment</option>
          <option value="EXPANSION">Expansion</option>
          <option value="INVENTORY">Inventory</option>
          <option value="PAYROLL">Payroll</option>
          <option value="DEBT_REFINANCE">Debt refinance</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <div v-if="step === 3" class="grid two">
        <label>Months in business
          <input v-model.number="form.time_in_business_months" type="number" min="0" required />
        </label>
        <label>Monthly revenue
          <input v-model.number="form.monthly_revenue" type="number" min="0" required />
        </label>
        <p class="estimate">Planning range: <strong>{{ estimatedRange }}</strong></p>
        <p class="muted">This is not an offer. It helps frame the review before documents and lender criteria.</p>
      </div>
      <div v-if="step === 4" class="grid two">
        <label>Business name<input v-model="form.business_name" required /></label>
        <label>ZIP/postal code<input v-model="form.postal_code" required /></label>
      </div>
      <div v-if="step === 5" class="grid">
        <div class="grid two">
          <label>First name<input v-model="form.first_name" autocomplete="given-name" required /></label>
          <label>Last name<input v-model="form.last_name" autocomplete="family-name" required /></label>
          <label>Email<input v-model="form.email" type="email" autocomplete="email" required /></label>
          <label>Phone<input v-model="form.phone" type="tel" autocomplete="tel" required /></label>
        </div>
        <label style="display:flex;grid-template-columns:auto 1fr;align-items:start">
          <input v-model="form.consent" type="checkbox" style="width:auto" required />
          {{ PUBLIC_CONSENT_TEXT }}
        </label>
      </div>
      <p v-if="stepError" class="error" role="alert">{{ stepError }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="form-actions">
        <button v-if="step > 1" type="button" class="secondary" @click="step--">Back</button>
        <button v-if="step < 5" type="button" @click="nextStep">Continue</button>
        <button v-else type="submit" :disabled="busy || !form.consent">
          {{ busy ? "Submitting…" : "See my options" }}
        </button>
      </div>
    </template>
    <div v-else class="success" role="status">
      <h2>Request received</h2>
      <p>Your reference is <strong>{{ accepted.reference }}</strong>.</p>
      <div class="form-actions">
        <a class="button" :href="accepted.next_action.url">Continue application</a>
        <a class="button secondary" href="/required-documents">Prepare documents</a>
      </div>
    </div>
  </form>
</template>
