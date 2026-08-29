<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  acceptBorrowerOffer,
  getAuthContext,
  getBorrowerWorkspace,
  listBorrowerApplicationOffers,
  money,
  type BorrowerApplication,
  type BorrowerOffer,
} from "@moneybee/api-client"

const organizationId = ref("")
const applicationId = ref("")
const applications = ref<BorrowerApplication[]>([])
const offers = ref<BorrowerOffer[]>([])
const loading = ref(true)
const busyOffer = ref("")
const message = ref("")
const error = ref("")

const selectedApplication = computed(() =>
  applications.value.find((application) => application.id === applicationId.value),
)

async function load() {
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
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loading.value = false
  }
}

async function loadOffers() {
  offers.value = applicationId.value
    ? await listBorrowerApplicationOffers(applicationId.value, organizationId.value)
    : []
}

async function changeApplication() {
  message.value = ""
  error.value = ""
  try {
    await loadOffers()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function selectOffer(offerId: string) {
  busyOffer.value = offerId
  message.value = ""
  error.value = ""
  try {
    await acceptBorrowerOffer(offerId, {
      idempotencyKey: crypto.randomUUID(),
      expectedApplicationVersion: selectedApplication.value?.version,
    }, organizationId.value)
    message.value = "Offer accepted. Your funding workflow has started."
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busyOffer.value = ""
  }
}

onMounted(load)
</script>

<template>
  <div class="container"><span class="eyebrow">YOUR OPTIONS</span><h2>Compare funding offers</h2>
    <p class="muted">Terms and disclosures are provided by the MoneyBee API.</p>
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
      <article v-for="offer in offers" :key="offer.id" class="card grid">
        <strong>{{ offer.product_type }}</strong><div class="metric">{{ money(offer.amount) }}</div>
        <div>{{ offer.term_months }} months · {{ offer.payment_frequency }}</div>
        <div>Payment {{ money(offer.payment_amount) }}</div>
        <button
          v-if="offer.status === 'AVAILABLE'"
          :disabled="Boolean(busyOffer)"
          @click="selectOffer(offer.id)"
        >
          {{ busyOffer === offer.id ? "Accepting…" : "Select offer" }}
        </button>
        <span v-else class="eyebrow">{{ offer.status }}</span>
      </article>
    </div>
    <div v-if="!loading && applicationId && !offers.length" class="card">No offers are available yet.</div>
    <div v-else-if="!loading && !applicationId" class="card error">No borrower application is available for this account.</div>
  </div>
</template>

<style scoped>
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
</style>
