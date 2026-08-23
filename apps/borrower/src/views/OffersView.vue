<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api, money } from "@moneybee/api-client"
const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const query = useQuery({
  queryKey: ["offers", applicationId],
  queryFn: () => api<any[]>("/applications/" + applicationId + "/offers"),
  enabled: Boolean(applicationId),
})
</script>

<template>
  <div class="container"><span class="eyebrow">YOUR OPTIONS</span><h2>Compare funding offers</h2>
    <p class="muted">Terms and disclosures are provided by the MoneyBee API.</p>
    <div class="grid three">
      <article v-for="offer in query.data.value || []" :key="offer.id" class="card grid">
        <strong>{{ offer.product_type }}</strong><div class="metric">{{ money(offer.amount) }}</div>
        <div>{{ offer.term_months }} months · {{ offer.payment_frequency }}</div>
        <div>Payment {{ money(offer.payment_amount) }}</div>
        <button>Select offer</button>
      </article>
    </div>
    <div v-if="applicationId && !query.isPending.value && !(query.data.value || []).length" class="card">No offers are available yet.</div>
  </div>
</template>
