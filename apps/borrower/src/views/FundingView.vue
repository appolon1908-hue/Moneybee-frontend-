<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Funding = {
  id: string
  application_id: string
  offer_id: string
  status: string
  approved_amount: string | null
  funded_amount: string | null
  provider_reference: string | null
  funds_sent_at: string | null
  funding_confirmed_at: string | null
  created_at: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const funding = ref<Funding | null>(null)
const loaded = ref(false)
const error = ref("")

async function load() {
  if (!applicationId) return
  error.value = ""
  try {
    funding.value = await api<Funding | null>(`/applications/${applicationId}/funding`)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loaded.value = true
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">FUNDING</span>
    <h2>Your funding</h2>
    <p class="muted">
      Track your deal from accepted offer through funds in your account.
    </p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="applicationId && loaded && !funding" class="card">
      Funding starts once you accept an offer and its conditions are satisfied.
    </div>
    <article v-if="funding" class="card grid">
      <StatusBadge :status="funding.status" />
      <div class="metric">{{ money(funding.funded_amount ?? funding.approved_amount) }}</div>
      <small v-if="funding.approved_amount">Approved {{ money(funding.approved_amount) }}</small>
      <small v-if="funding.provider_reference">Reference {{ funding.provider_reference }}</small>
      <small v-if="funding.funds_sent_at">
        Funds sent {{ new Date(funding.funds_sent_at).toLocaleDateString() }}
      </small>
      <small v-if="funding.funding_confirmed_at">
        Funded {{ new Date(funding.funding_confirmed_at).toLocaleDateString() }}
      </small>
    </article>
  </main>
</template>
