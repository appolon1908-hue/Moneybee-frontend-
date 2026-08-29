<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Renewal = {
  id: string
  original_funding_id: string
  application_id: string
  eligible_from: string
  eligibility_status: string
  estimated_amount: string | null
  status: string
  created_at: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const rows = ref<Renewal[]>([])
const error = ref("")

async function load() {
  if (!applicationId) return
  error.value = ""
  try {
    rows.value = await api<Renewal[]>(`/applications/${applicationId}/renewal-opportunities`)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">FUNDING</span>
    <h2>Renewal offers</h2>
    <p class="muted">
      Once a funded deal is far enough along, we'll surface renewal offers here.
    </p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="applicationId && !rows.length" class="card">
      No renewal opportunities yet.
    </div>
    <div class="grid two">
      <article v-for="row in rows" :key="row.id" class="card grid">
        <StatusBadge :status="row.status" />
        <div class="metric">{{ money(row.estimated_amount) }}</div>
        <small>Eligible since {{ new Date(row.eligible_from).toLocaleDateString() }}</small>
        <small>{{ row.eligibility_status }}</small>
      </article>
    </div>
  </main>
</template>
