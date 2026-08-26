<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  listCrmDeliveries,
  requeueCrmDelivery,
  type CrmDeliverySummary,
} from "@moneybee/api-client"

const rows = ref<CrmDeliverySummary[]>([])
const statusFilter = ref("")
const busy = ref(false)
const requeueing = ref<string | null>(null)
const error = ref("")

async function load(): Promise<void> {
  busy.value = true
  error.value = ""
  try {
    rows.value = await listCrmDeliveries({ status: statusFilter.value || undefined, limit: 100 })
  } catch (value) {
    error.value = value instanceof Error ? value.message : "Unable to load CRM deliveries."
  } finally {
    busy.value = false
  }
}

async function requeue(row: CrmDeliverySummary): Promise<void> {
  const reason = window.prompt("Reason for requeue", "Authorized operations retry")
  if (!reason || reason.trim().length < 5) return
  requeueing.value = row.id
  error.value = ""
  try {
    await requeueCrmDelivery(row.id, reason.trim())
    await load()
  } catch (value) {
    error.value = value instanceof Error ? value.message : "Unable to requeue the delivery."
  } finally {
    requeueing.value = null
  }
}

function canRequeue(row: CrmDeliverySummary): boolean {
  return !["DELIVERED", "LEASED"].includes(row.status)
}

onMounted(load)
</script>

<template>
  <section class="grid">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMIN · INTEGRATIONS</span>
        <h1>CRM deliveries</h1>
        <p class="muted">Monitor MoneyBee outbox events destined for Codestra and Odoo CRM projection.</p>
      </div>
      <div class="toolbar">
        <label>Status
          <select v-model="statusFilter" @change="load">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="RETRY">Retry</option>
            <option value="LEASED">Leased</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DEAD">Dead letter</option>
          </select>
        </label>
        <button type="button" @click="load" :disabled="busy">{{ busy ? "Loading…" : "Refresh" }}</button>
      </div>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Reference</th><th>Event</th><th>Status</th><th>Attempts</th><th>Destination</th><th>Last error</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td><strong>{{ row.reference || row.aggregate_id }}</strong><br><small>{{ row.intake_type || row.aggregate_type }}</small></td>
            <td>{{ row.event_type }}</td>
            <td><span class="status-pill">{{ row.status }}</span></td>
            <td>{{ row.attempt_count }}</td>
            <td>{{ row.destination || "—" }}</td>
            <td class="error-cell">{{ row.last_error || "—" }}</td>
            <td><button type="button" class="secondary" :disabled="!canRequeue(row) || requeueing === row.id" @click="requeue(row)">{{ requeueing === row.id ? "Requeueing…" : "Requeue" }}</button></td>
          </tr>
          <tr v-if="!busy && rows.length === 0"><td colspan="7" class="muted">No CRM deliveries match this filter.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="muted">Requeue is audited by the backend. The admin portal cannot directly write to Odoo or bypass the Codestra middleware.</p>
  </section>
</template>
