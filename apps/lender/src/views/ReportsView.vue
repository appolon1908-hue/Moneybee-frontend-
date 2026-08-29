<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api, money } from "@moneybee/api-client"

type Dashboard = {
  lender_id: string | null
  programs: number
  active_programs: number
  submissions: number
  needs_review: number
  conditions_pending: number
  offers_out: number
  funded_deals: number
  total_funded: string
}

type Portfolio = {
  summary: {
    offer_count: number
    accepted_or_funded_count: number
    accepted_or_funded_amount: string
  }
  submission_status_counts: Record<string, number>
}

const dashboard = ref<Dashboard | null>(null)
const portfolio = ref<Portfolio | null>(null)
const error = ref("")

async function load() {
  error.value = ""
  try {
    const [dashboardResult, portfolioResult] = await Promise.all([
      api<Dashboard>("/lender/dashboard"),
      api<Portfolio>("/lender/portfolio"),
    ])
    dashboard.value = dashboardResult
    portfolio.value = portfolioResult
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

function conversionRate(): string {
  if (!dashboard.value || dashboard.value.submissions === 0) return "—"
  return `${Math.round((dashboard.value.funded_deals / dashboard.value.submissions) * 100)}%`
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Reports</h2>
    <p class="muted">Portfolio performance across every program your organization runs.</p>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>

    <div v-if="dashboard" class="grid three">
      <div class="card">
        <div class="muted">Total submissions</div>
        <div class="metric">{{ dashboard.submissions }}</div>
      </div>
      <div class="card">
        <div class="muted">Needs review</div>
        <div class="metric">{{ dashboard.needs_review }}</div>
      </div>
      <div class="card">
        <div class="muted">Conditions pending</div>
        <div class="metric">{{ dashboard.conditions_pending }}</div>
      </div>
      <div class="card">
        <div class="muted">Offers out</div>
        <div class="metric">{{ dashboard.offers_out }}</div>
      </div>
      <div class="card">
        <div class="muted">Funded deals</div>
        <div class="metric">{{ dashboard.funded_deals }}</div>
      </div>
      <div class="card">
        <div class="muted">Total funded</div>
        <div class="metric">{{ money(dashboard.total_funded) }}</div>
      </div>
      <div class="card">
        <div class="muted">Submission → funded rate</div>
        <div class="metric">{{ conversionRate() }}</div>
      </div>
      <div class="card">
        <div class="muted">Active programs</div>
        <div class="metric">{{ dashboard.active_programs }} / {{ dashboard.programs }}</div>
      </div>
    </div>

    <section v-if="portfolio" class="section">
      <h3>Submissions by status</h3>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(count, status) in portfolio.submission_status_counts" :key="status">
            <td>{{ status }}</td>
            <td>{{ count }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}
</style>
