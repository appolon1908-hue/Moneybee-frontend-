<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Contract = {
  id: string
  application_id: string
  offer_id: string
  template_version: string
  provider: string | null
  status: string
  sent_at: string | null
  signed_at: string | null
  created_at: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const contract = ref<Contract | null>(null)
const loaded = ref(false)
const error = ref("")

async function load() {
  if (!applicationId) return
  error.value = ""
  try {
    contract.value = await api<Contract | null>(`/applications/${applicationId}/contract`)
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
    <h2>Your contract</h2>
    <p class="muted">
      Your loan agreement is drafted once your conditions are satisfied.
    </p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="applicationId && loaded && !contract" class="card">
      Your contract will appear here once conditions are satisfied.
    </div>
    <article v-if="contract" class="card grid">
      <StatusBadge :status="contract.status" />
      <small>Template version {{ contract.template_version }}</small>
      <p v-if="contract.status === 'DRAFT'" class="muted">
        Your agreement is being prepared for signature.
      </p>
      <p v-else-if="contract.status === 'SENT'" class="muted">
        Sent for signature{{ contract.sent_at ? " " + new Date(contract.sent_at).toLocaleDateString() : "" }}.
        Check your email for the secure signing link.
      </p>
      <p v-else-if="contract.status === 'SIGNED'" class="muted">
        Signed{{ contract.signed_at ? " " + new Date(contract.signed_at).toLocaleDateString() : "" }}.
        Funding proceeds automatically from here.
      </p>
      <p v-else-if="contract.status === 'DECLINED'" class="muted">
        This agreement was declined. Contact your MoneyBee representative for next steps.
      </p>
      <p v-else-if="contract.status === 'VOIDED'" class="muted">
        This agreement was voided. A new one will be issued if your deal proceeds.
      </p>
      <p v-else-if="contract.status === 'EXPIRED'" class="muted">
        The signing window expired. Contact your MoneyBee representative to resend it.
      </p>
    </article>
  </main>
</template>
