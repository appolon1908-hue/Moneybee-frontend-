<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api, money } from "@moneybee/api-client"

type Funding = {
  id: string
  application_id: string
  status: string
  approved_amount: number | null
  funded_amount: number | null
}

type Complaint = {
  id: string
  category: string
  priority: string
  status: string
  created_at: string
}

type IntegrationEvent = {
  id: string
  provider: string
  event_type: string
  status: string
  attempts: number
  last_error: string | null
}

type ReconciliationRun = {
  id: string
  provider: string
  status: string
  checked: number
  mismatches: number
}

const fundings = ref<Funding[]>([])
const complaints = ref<Complaint[]>([])
const integrations = ref<IntegrationEvent[]>([])
const reconciliations = ref<ReconciliationRun[]>([])
const error = ref("")

onMounted(async () => {
  try {
    ;[
      fundings.value,
      complaints.value,
      integrations.value,
      reconciliations.value,
    ] = await Promise.all([
      api<Funding[]>("/admin/fundings"),
      api<Complaint[]>("/admin/complaints"),
      api<IntegrationEvent[]>("/admin/integration-events"),
      api<ReconciliationRun[]>("/admin/reconciliation-runs"),
    ])
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
})
</script>

<template>
  <main class="container">
    <span class="eyebrow">OPERATIONS</span>
    <h2>Lifecycle control center</h2>
    <p class="muted">
      This view is read-only. Live provider activation remains controlled by backend
      capabilities and provider readiness.
    </p>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div class="grid three">
      <div class="card">
        <div class="muted">Funding workflows</div>
        <div class="metric">{{ fundings.length }}</div>
      </div>
      <div class="card">
        <div class="muted">Open complaints</div>
        <div class="metric">
          {{ complaints.filter((row) => row.status === "OPEN").length }}
        </div>
      </div>
      <div class="card">
        <div class="muted">Integration failures</div>
        <div class="metric">
          {{ integrations.filter((row) => row.status === "FAILED").length }}
        </div>
      </div>
      <div class="card">
        <div class="muted">Reconciliation mismatches</div>
        <div class="metric">
          {{ reconciliations.reduce((sum, row) => sum + row.mismatches, 0) }}
        </div>
      </div>
    </div>

    <section class="card table-card">
      <h3>Funding workflow</h3>
      <table>
        <thead>
          <tr><th>Application</th><th>Status</th><th>Approved</th><th>Funded</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in fundings" :key="row.id">
            <td>{{ row.application_id.slice(0, 8) }}</td>
            <td>{{ row.status }}</td>
            <td>{{ money(row.approved_amount) }}</td>
            <td>{{ money(row.funded_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card table-card">
      <h3>Complaints</h3>
      <table>
        <thead>
          <tr><th>Category</th><th>Priority</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in complaints" :key="row.id">
            <td>{{ row.category.replaceAll("_", " ") }}</td>
            <td>{{ row.priority }}</td>
            <td>{{ row.status }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card table-card">
      <h3>Provider events</h3>
      <table>
        <thead>
          <tr><th>Provider</th><th>Event</th><th>Status</th><th>Attempts</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in integrations" :key="row.id">
            <td>{{ row.provider }}</td>
            <td>{{ row.event_type }}</td>
            <td>{{ row.status }}</td>
            <td>{{ row.attempts }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.table-card {
  margin-top: 24px;
  overflow-x: auto;
}
</style>
