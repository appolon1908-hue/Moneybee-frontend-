<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  IdempotencyKeyRegistry,
  acceptBorrowerOffer,
  acknowledgeBorrowerCommercialFinancingDisclosure,
  getAuthContext,
  getBorrowerCommercialFinancingDisclosure,
  getBorrowerWorkspace,
  listBorrowerApplicationOffers,
  money,
  type BorrowerApplication,
  type BorrowerOffer,
  type CommercialFinancingDisclosure,
} from "@moneybee/api-client"
import { disclosureCanBeAccepted } from "../offer-disclosure-state"

const organizationId = ref("")
const applicationId = ref("")
const applications = ref<BorrowerApplication[]>([])
const offers = ref<BorrowerOffer[]>([])
const loading = ref(true)
const busyOffer = ref("")
const busyAction = ref<"" | "review" | "acknowledge" | "accept">("")
const message = ref("")
const error = ref("")
const reviewedDisclosure = ref<CommercialFinancingDisclosure | null>(null)
const commandKeys = new IdempotencyKeyRegistry()

const selectedApplication = computed(() =>
  applications.value.find((application) => application.id === applicationId.value),
)
const selectedOffer = computed(() =>
  offers.value.find((offer) => offer.id === reviewedDisclosure.value?.offer_id) || null,
)
const canAcceptSelectedOffer = computed(() =>
  disclosureCanBeAccepted(reviewedDisclosure.value),
)

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Request failed"
}

function recordMutationFailure(operation: string, caught: unknown): void {
  commandKeys.recordFailure(operation, caught)
  error.value = describe(caught)
}

function closeDisclosure(): void {
  reviewedDisclosure.value = null
  busyOffer.value = ""
  busyAction.value = ""
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ""
  try {
    const context = await getAuthContext()
    organizationId.value = context.active_organization_id ?? ""
    const workspace = await getBorrowerWorkspace(organizationId.value)
    applications.value = workspace.applications
    applicationId.value = applicationId.value || applications.value[0]?.id || ""
    await loadOffers()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    loading.value = false
  }
}

async function loadOffers(): Promise<void> {
  offers.value = applicationId.value
    ? await listBorrowerApplicationOffers(applicationId.value, organizationId.value)
    : []

  if (
    reviewedDisclosure.value
    && !offers.value.some((offer) => offer.id === reviewedDisclosure.value?.offer_id)
  ) {
    closeDisclosure()
  }
}

async function changeApplication(): Promise<void> {
  message.value = ""
  error.value = ""
  closeDisclosure()
  try {
    await loadOffers()
  } catch (caught) {
    error.value = describe(caught)
  }
}

async function reviewOffer(offerId: string): Promise<void> {
  busyOffer.value = offerId
  busyAction.value = "review"
  message.value = ""
  error.value = ""
  reviewedDisclosure.value = null
  try {
    reviewedDisclosure.value = await getBorrowerCommercialFinancingDisclosure(offerId)
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busyOffer.value = ""
    busyAction.value = ""
  }
}

async function acknowledgeDisclosure(): Promise<void> {
  const disclosure = reviewedDisclosure.value
  if (!disclosure) return
  if (!window.confirm("Confirm that you have reviewed this disclosure and want to record your acknowledgment. This does not accept the offer.")) return

  const operation = `borrower-disclosure-acknowledge:${disclosure.id}`
  busyOffer.value = disclosure.offer_id
  busyAction.value = "acknowledge"
  message.value = ""
  error.value = ""
  try {
    reviewedDisclosure.value = await acknowledgeBorrowerCommercialFinancingDisclosure(
      disclosure.offer_id,
      commandKeys.forOperation(operation),
    )
    commandKeys.resolve(operation)
    message.value = "Disclosure acknowledgment recorded. The offer has not yet been accepted."
  } catch (caught) {
    recordMutationFailure(operation, caught)
  } finally {
    busyOffer.value = ""
    busyAction.value = ""
  }
}

async function acceptSelectedOffer(): Promise<void> {
  const disclosure = reviewedDisclosure.value
  const offer = selectedOffer.value
  if (!disclosure || !offer || !disclosureCanBeAccepted(disclosure)) {
    error.value = "Review and acknowledge the commercial-financing disclosure before accepting this offer."
    return
  }
  if (!window.confirm("Accept this offer and begin the funding workflow? The recorded disclosure acknowledgment remains separate from this acceptance.")) return

  const operation = `accept-borrower-offer:${offer.id}`
  busyOffer.value = offer.id
  busyAction.value = "accept"
  message.value = ""
  error.value = ""
  try {
    await acceptBorrowerOffer(offer.id, {
      idempotencyKey: commandKeys.forOperation(operation),
      expectedApplicationVersion: selectedApplication.value?.version,
    }, organizationId.value)
    commandKeys.resolve(operation)
    message.value = "Offer accepted. Your funding workflow has started."
    closeDisclosure()
    await load()
  } catch (caught) {
    recordMutationFailure(operation, caught)
  } finally {
    busyOffer.value = ""
    busyAction.value = ""
  }
}

onMounted(load)
</script>

<template>
  <div class="container offers-page">
    <span class="eyebrow">YOUR OPTIONS</span>
    <h2>Compare funding offers</h2>
    <p class="muted">Review the backend-issued commercial-financing disclosure before recording acknowledgment and accepting an offer.</p>

    <label v-if="applications.length" class="card selector">
      Application
      <select v-model="applicationId" @change="changeApplication">
        <option
          v-for="application in applications"
          :key="application.id"
          :value="application.id"
        >
          {{ application.status.replaceAll("_", " ") }} · {{ application.application_number }}
        </option>
      </select>
    </label>

    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="loading" class="card">Loading offers…</div>

    <div class="grid three">
      <article v-for="offer in offers" :key="offer.id" class="card offer-card">
        <strong>{{ offer.product_type }}</strong>
        <div class="metric">{{ money(offer.amount) }}</div>
        <div>{{ offer.term_months }} months · {{ offer.payment_frequency }}</div>
        <div>Payment {{ money(offer.payment_amount) }}</div>
        <button
          v-if="offer.status === 'AVAILABLE'"
          :disabled="Boolean(busyOffer)"
          @click="reviewOffer(offer.id)"
        >
          {{ busyOffer === offer.id && busyAction === "review" ? "Loading disclosure…" : "Review disclosure" }}
        </button>
        <span v-else class="eyebrow">{{ offer.status }}</span>
      </article>
    </div>

    <section
      v-if="reviewedDisclosure && selectedOffer"
      class="card disclosure-panel"
      aria-labelledby="disclosure-title"
    >
      <div class="disclosure-heading">
        <div>
          <span class="eyebrow">REQUIRED COMMERCIAL-FINANCING DISCLOSURE</span>
          <h3 id="disclosure-title">{{ selectedOffer.product_type }} offer</h3>
        </div>
        <button class="secondary" :disabled="Boolean(busyOffer)" @click="closeDisclosure">Close</button>
      </div>

      <div class="disclosure-values" aria-label="Disclosure values">
        <div><span>Amount financed</span><strong>{{ money(reviewedDisclosure.amount_financed) }}</strong></div>
        <div><span>Total repayment</span><strong>{{ money(reviewedDisclosure.total_repayment_amount) }}</strong></div>
        <div><span>Payment</span><strong>{{ money(reviewedDisclosure.payment_amount) }}</strong></div>
        <div><span>Frequency</span><strong>{{ reviewedDisclosure.payment_frequency }}</strong></div>
        <div><span>Term</span><strong>{{ reviewedDisclosure.term_months }} months</strong></div>
        <div><span>Estimated APR</span><strong>{{ reviewedDisclosure.estimated_apr ? `${reviewedDisclosure.estimated_apr}%` : "Unavailable" }}</strong></div>
      </div>

      <details open>
        <summary>Disclosure text</summary>
        <pre>{{ reviewedDisclosure.disclosure_text }}</pre>
      </details>

      <p class="muted">{{ reviewedDisclosure.prepayment_policy }}</p>

      <div v-if="reviewedDisclosure.acknowledged_at" class="acknowledged" role="status">
        Acknowledged {{ new Date(reviewedDisclosure.acknowledged_at).toLocaleString() }}
        <span v-if="reviewedDisclosure.acknowledged_by">by {{ reviewedDisclosure.acknowledged_by }}</span>.
      </div>
      <div v-else class="disclosure-actions">
        <button
          :disabled="Boolean(busyOffer)"
          @click="acknowledgeDisclosure"
        >
          {{ busyAction === "acknowledge" ? "Recording acknowledgment…" : "Record disclosure acknowledgment" }}
        </button>
        <small>Acknowledgment confirms review only. It does not accept the offer.</small>
      </div>

      <div class="acceptance-actions">
        <button
          :disabled="Boolean(busyOffer) || !canAcceptSelectedOffer"
          @click="acceptSelectedOffer"
        >
          {{ busyAction === "accept" ? "Accepting offer…" : "Accept acknowledged offer" }}
        </button>
        <small v-if="!canAcceptSelectedOffer">Acceptance remains disabled until acknowledgment is recorded.</small>
      </div>
    </section>

    <div v-if="!loading && applicationId && !offers.length" class="card">No offers are available yet.</div>
    <div v-else-if="!loading && !applicationId" class="card error">No borrower application is available for this account.</div>
  </div>
</template>

<style scoped>
.offers-page { display: grid; gap: 20px; }
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
.selector {
  display: grid;
  gap: 0.5rem;
  font-weight: 700;
}
.selector select {
  min-height: 44px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  font: inherit;
}
.offer-card { display: grid; gap: 12px; }
.disclosure-panel { display: grid; gap: 20px; border-top: 5px solid var(--gold); }
.disclosure-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.disclosure-values { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.disclosure-values div { display: grid; gap: 4px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; }
.disclosure-values span { color: var(--slate); font-size: .8rem; font-weight: 700; }
.disclosure-values strong { font-size: 1.1rem; }
details { display: grid; gap: 12px; }
summary { cursor: pointer; font-weight: 800; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.55; }
.acknowledged { border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; background: #ecfdf5; color: #166534; font-weight: 700; }
.disclosure-actions, .acceptance-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.disclosure-actions small, .acceptance-actions small { color: var(--slate); }
.acceptance-actions { padding-top: 16px; border-top: 1px solid #e2e8f0; }
@media (max-width: 760px) {
  .disclosure-heading { align-items: stretch; flex-direction: column; }
  .disclosure-values { grid-template-columns: 1fr; }
}
</style>
