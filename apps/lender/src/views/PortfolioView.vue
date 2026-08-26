<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  getAuthContext,
  getLenderPortfolio,
  type LenderPortfolio,
} from "@moneybee/api-client";

const portfolio = ref<LenderPortfolio | null>(null);
const loading = ref(true);
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    portfolio.value = await getLenderPortfolio(context.active_organization_id);
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load lender portfolio.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header>
      <div><p class="eyebrow">Portfolio</p><h1>Accepted and funded positions at a glance.</h1><p>This read-only portal view does not initiate disbursement, repayment, or collections activity.</p></div>
      <button type="button" :disabled="loading" @click="load">Refresh</button>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading portfolio…</p>
    <template v-else-if="portfolio">
      <section class="metrics">
        <article><span>Offers</span><strong>{{ portfolio.summary.offer_count }}</strong></article>
        <article><span>Accepted or funded</span><strong>{{ portfolio.summary.accepted_or_funded_count }}</strong></article>
        <article class="amount"><span>Accepted or funded amount</span><strong>{{ portfolio.summary.accepted_or_funded_amount }}</strong></article>
      </section>
      <section class="positions">
        <article v-for="position in portfolio.positions" :key="String(position.id)">
          <div><p class="eyebrow">Application</p><h2>{{ position.application_id }}</h2><small>{{ position.payment_frequency ?? "Payment schedule pending" }}</small></div>
          <dl>
            <dt>Status</dt><dd>{{ position.status }}</dd>
            <dt>Amount</dt><dd>{{ position.amount ?? "—" }}</dd>
            <dt>Term</dt><dd>{{ position.term_months ? `${position.term_months} months` : "—" }}</dd>
            <dt>Rate</dt><dd>{{ position.interest_rate ?? position.factor_rate ?? "—" }}</dd>
          </dl>
        </article>
        <p v-if="!portfolio.positions.length" class="empty">No accepted or funded positions are available.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1280px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header,.positions article { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
header > div { max-width:900px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#006454; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
button { min-height:44px; border:0; border-radius:999px; padding:.7rem 1rem; color:white; background:#006454; font:inherit; font-weight:850; cursor:pointer; }
.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
.metrics article,.positions article { border:1px solid #dce7e4; border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(10 37 64 / 7%); }
.metrics article { display:grid; gap:.35rem; }
.metrics strong { font-size:2rem; }
.metrics .amount { grid-column:span 2; }
.positions { display:grid; gap:.85rem; }
.positions article h2 { overflow-wrap:anywhere; }
dl { display:grid; grid-template-columns:auto auto; gap:.45rem 1rem; min-width:260px; margin:0; }
dt { color:#64748b; } dd { margin:0; text-align:right; font-weight:750; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#e7f7f3; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:780px) { header,.positions article { flex-direction:column; } .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } .metrics .amount { grid-column:span 2; } dl { width:100%; } }
@media (max-width:520px) { .metrics { grid-template-columns:1fr; } .metrics .amount { grid-column:auto; } }
</style>
