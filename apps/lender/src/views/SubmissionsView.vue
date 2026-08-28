<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Submission = {
  id: string
  application_id: string
  lender_id: string
  program_id: string
  program_version: number
  status: string
  created_at: string
}

const rows = ref<Submission[]>([])
const selected = ref<Submission | null>(null)
const busy = ref(false)
const error = ref("")
const message = ref("")
const conditionDescription = ref("")
const offer = reactive({
  product_type: "WORKING_CAPITAL",
  amount: 50000,
  term_months: 12,
  payment_frequency: "MONTHLY",
  payment_amount: 5000,
  apr: 15,
  origination_fee: 0,
  total_repayment: 60000,
})

async function load() {
  error.value = ""
  try {
    rows.value = await api<Submission[]>("/lender/submissions")
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function run(action: () => Promise<unknown>, success: string) {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await action()
    message.value = success
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busy.value = false
  }
}

function requestCondition() {
  if (!selected.value) return
  return run(
    () =>
      api(`/lender/submissions/${selected.value?.id}/conditions`, {
        method: "POST",
        body: JSON.stringify({description: conditionDescription.value}),
      }),
    "Condition sent to the borrower.",
  )
}

function createOffer() {
  if (!selected.value) return
  return run(
    () =>
      api(`/lender/submissions/${selected.value?.id}/offers`, {
        method: "POST",
        body: JSON.stringify({
          application_id: selected.value?.application_id,
          lender_id: selected.value?.lender_id,
          program_id: selected.value?.program_id,
          ...offer,
        }),
      }),
    "Offer created.",
  )
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Application submissions</h2>
    <p class="muted">
      Only submissions assigned to your Keycloak organization are returned.
    </p>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="!rows.length" class="card">No applications are assigned.</div>
    <div class="grid two">
      <article v-for="row in rows" :key="row.id" class="card grid">
        <StatusBadge :status="row.status" />
        <strong>Application {{ row.application_id.slice(0, 8) }}</strong>
        <small>Program version {{ row.program_version }}</small>
        <button class="secondary" @click="selected = row">Review</button>
      </article>
    </div>

    <section v-if="selected" class="card review">
      <div>
        <span class="eyebrow">SELECTED APPLICATION</span>
        <h3>{{ selected.application_id }}</h3>
      </div>
      <div class="grid two">
        <label>
          Condition request
          <textarea v-model="conditionDescription" rows="4"></textarea>
          <button
            :disabled="busy || conditionDescription.trim().length < 3"
            @click="requestCondition"
          >
            Request condition
          </button>
        </label>
        <div class="grid">
          <strong>Create offer</strong>
          <label>
            Amount
            <input v-model.number="offer.amount" type="number" min="1" />
          </label>
          <label>
            Term months
            <input v-model.number="offer.term_months" type="number" min="1" />
          </label>
          <label>
            Monthly payment
            <input v-model.number="offer.payment_amount" type="number" min="1" />
          </label>
          <label>
            Total repayment
            <input v-model.number="offer.total_repayment" type="number" min="1" />
          </label>
          <p>Offer amount: {{ money(offer.amount) }}</p>
          <button :disabled="busy" @click="createOffer">Create offer</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.review {
  margin-top: 24px;
}
label {
  display: grid;
  gap: 7px;
  font-weight: 700;
}
input,
textarea {
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  font: inherit;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
</style>
