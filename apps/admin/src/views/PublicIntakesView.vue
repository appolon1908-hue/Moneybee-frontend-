<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  getPublicIntake,
  listPublicIntakes,
  type PublicIntakeDetail,
  type PublicIntakeSummary,
} from "@moneybee/api-client"

const rows = ref<PublicIntakeSummary[]>([])
const selected = ref<PublicIntakeDetail | null>(null)
const intakeType = ref("")
const busy = ref(false)
const error = ref("")

async function load(): Promise<void> {
  busy.value = true
  error.value = ""
  try {
    rows.value = await listPublicIntakes({
      intake_type: intakeType.value || undefined,
      limit: 100,
    })
  } catch (value) {
    error.value = value instanceof Error ? value.message : "Unable to load public intakes."
  } finally {
    busy.value = false
  }
}

async function inspect(id: string): Promise<void> {
  error.value = ""
  try {
    selected.value = await getPublicIntake(id)
  } catch (value) {
    error.value = value instanceof Error ? value.message : "Unable to load intake details."
  }
}

onMounted(load)
</script>

<template>
  <section class="grid">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMIN · ACQUISITION</span>
        <h1>Public intakes</h1>
        <p class="muted">Review authoritative MoneyBee form records before controlled CRM delivery.</p>
      </div>
      <div class="toolbar">
        <label>Intake type
          <select v-model="intakeType" @change="load">
            <option value="">All types</option>
            <option value="CONTACT_REQUEST">Contact</option>
            <option value="CALLBACK_REQUEST">Callback</option>
            <option value="LENDER_PARTNER_INQUIRY">Lender partner</option>
            <option value="REFERRAL_PARTNER_INQUIRY">Referral partner</option>
            <option value="DEAL_SUBMISSION_INQUIRY">Deal inquiry</option>
          </select>
        </label>
        <button type="button" @click="load" :disabled="busy">{{ busy ? "Loading…" : "Refresh" }}</button>
      </div>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Reference</th><th>Type</th><th>Business</th><th>Contact</th><th>Status</th><th>Received</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td><strong>{{ row.reference }}</strong></td>
            <td>{{ row.intake_type }}</td>
            <td>{{ row.business_name || "—" }}</td>
            <td>{{ row.contact_name }}<br><small>{{ row.email }}</small></td>
            <td><span class="status-pill">{{ row.status }}</span></td>
            <td>{{ new Date(row.created_at).toLocaleString() }}</td>
            <td><button type="button" class="secondary" @click="inspect(row.id)">Inspect</button></td>
          </tr>
          <tr v-if="!busy && rows.length === 0"><td colspan="7" class="muted">No intake records match this filter.</td></tr>
        </tbody>
      </table>
    </div>

    <article v-if="selected" class="card grid detail-card">
      <div class="page-header">
        <div><span class="eyebrow">{{ selected.intake_type }}</span><h2>{{ selected.reference }}</h2></div>
        <button type="button" class="secondary" @click="selected = null">Close</button>
      </div>
      <div class="grid three">
        <div><strong>Contact</strong><p>{{ selected.contact.first_name }} {{ selected.contact.last_name }}<br>{{ selected.contact.email }}<br>{{ selected.contact.phone || "No phone" }}</p></div>
        <div><strong>Business</strong><p>{{ selected.business_name || "Not supplied" }}</p></div>
        <div><strong>Subject</strong><p>{{ selected.subject || "Not supplied" }}</p></div>
      </div>
      <div><strong>Message</strong><p class="muted">{{ selected.message || "No message supplied." }}</p></div>
      <div><strong>Consent evidence</strong><ul><li v-for="item in selected.consents" :key="item.id">{{ item.type }} · {{ item.document_version }} · {{ item.accepted ? "accepted" : "not accepted" }}</li></ul></div>
    </article>
  </section>
</template>
