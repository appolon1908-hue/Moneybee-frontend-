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
  product_type: string
  created_at: string
  funding_confirmed_at: string | null
}

const rows = ref<Funding[]>([])
const error = ref("")

async function load() {
  error.value = ""
  try {
    rows.value = await api<Funding[]>("/lender/fundings")
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Funded deals</h2>
    <p class="muted">Every funding your organization's offers have produced, most recent first.</p>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="!rows.length" class="card">No fundings yet.</div>
    <div class="grid two">
      <article v-for="row in rows" :key="row.id" class="card grid">
        <StatusBadge :status="row.status" />
        <strong>{{ row.product_type }}</strong>
        <div class="metric">{{ money(row.funded_amount ?? row.approved_amount) }}</div>
        <small>Application {{ row.application_id.slice(0, 8) }}</small>
        <small v-if="row.provider_reference">Ref {{ row.provider_reference }}</small>
        <small v-if="row.funding_confirmed_at">
          Funded {{ new Date(row.funding_confirmed_at).toLocaleDateString() }}
        </small>
      </article>
    </div>
  </main>
</template>
