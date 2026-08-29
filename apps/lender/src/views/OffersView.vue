<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Portfolio = {
  summary: {
    offer_count: number
    accepted_or_funded_count: number
    accepted_or_funded_amount: string
  }
  positions: Array<{
    offer_id: string
    application_id: string
    product_type: string
    amount: string
    payment_frequency: string
    payment_amount: string
    status: string
    version: number
    expires_at: string | null
    created_at: string
  }>
}

const portfolio = ref<Portfolio | null>(null)
const error = ref("")

async function load() {
  error.value = ""
  try {
    portfolio.value = await api<Portfolio>("/lender/portfolio")
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Offers</h2>
    <p class="muted">Every offer your organization has extended, most recent first.</p>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="portfolio" class="grid three">
      <div class="card">
        <div class="muted">Offers extended</div>
        <div class="metric">{{ portfolio.summary.offer_count }}</div>
      </div>
      <div class="card">
        <div class="muted">Accepted or funded</div>
        <div class="metric">{{ portfolio.summary.accepted_or_funded_count }}</div>
      </div>
      <div class="card">
        <div class="muted">Accepted or funded volume</div>
        <div class="metric">{{ money(portfolio.summary.accepted_or_funded_amount) }}</div>
      </div>
    </div>
    <div v-if="portfolio && !portfolio.positions.length" class="card">No offers yet.</div>
    <div class="grid two">
      <article
        v-for="offer in portfolio?.positions ?? []"
        :key="offer.offer_id"
        class="card grid"
      >
        <StatusBadge :status="offer.status" />
        <strong>{{ offer.product_type }}</strong>
        <div class="metric">{{ money(offer.amount) }}</div>
        <small>{{ money(offer.payment_amount) }} · {{ offer.payment_frequency }}</small>
        <small>Application {{ offer.application_id.slice(0, 8) }}</small>
        <small v-if="offer.expires_at">Expires {{ new Date(offer.expires_at).toLocaleDateString() }}</small>
      </article>
    </div>
  </main>
</template>
