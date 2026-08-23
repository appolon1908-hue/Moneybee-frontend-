<script setup lang="ts">
import { ref } from "vue"
import { useQuery } from "@tanstack/vue-query"
import { api, money } from "@moneybee/api-client"

type Offer = {
  id: string
  product_type: string
  amount: number
  term_months: number
  payment_frequency: string
  payment_amount: number
  status: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const busyOffer = ref("")
const message = ref("")
const error = ref("")
const query = useQuery({
  queryKey: ["offers", applicationId],
  queryFn: () => api<Offer[]>("/applications/" + applicationId + "/offers"),
  enabled: Boolean(applicationId),
})

async function selectOffer(offerId: string) {
  busyOffer.value = offerId
  message.value = ""
  error.value = ""
  try {
    await api(`/offers/${offerId}/accept`, {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
    })
    message.value = "Offer accepted. Your funding workflow has started."
    await query.refetch()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busyOffer.value = ""
  }
}
</script>

<template>
  <div class="container"><span class="eyebrow">YOUR OPTIONS</span><h2>Compare funding offers</h2>
    <p class="muted">Terms and disclosures are provided by the MoneyBee API.</p>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div class="grid three">
      <article v-for="offer in query.data.value || []" :key="offer.id" class="card grid">
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
    <div v-if="applicationId && !query.isPending.value && !(query.data.value || []).length" class="card">No offers are available yet.</div>
  </div>
</template>

<style scoped>
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
</style>
