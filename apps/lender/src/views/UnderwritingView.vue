<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type QueueItem = {
  submission_id: string
  application_id: string
  status: string
  version: number
  requested_amount: string
  monthly_revenue: string
  analysis_available: boolean
  average_monthly_deposits: string | null
  nsf_count_90d: number | null
  risk_flags: string[]
  submitted_at: string | null
  created_at: string
}

type Workspace = {
  submission: Record<string, unknown>
  application: Record<string, unknown>
  business: { legal_name: string; entity_type: string; industry: string } | null
  financial_profile: { annual_revenue: string | null; monthly_revenue: string | null } | null
  bank_analysis: {
    average_monthly_deposits: string | null
    negative_balance_days_90d: number | null
    nsf_count_90d: number | null
    revenue_trend: string | null
    risk_flags: string[]
  } | null
  conditions: Array<{ id: string; description: string; status: string; created_at: string }>
  offers: Array<{ id: string; amount: string; status: string }>
}

type Decision = "APPROVE" | "DECLINE" | "CONDITIONS" | "FRAUD_REVIEW" | "COMPLIANCE_REVIEW"

const rows = ref<QueueItem[]>([])
const selected = ref<QueueItem | null>(null)
const workspace = ref<Workspace | null>(null)
const busy = ref(false)
const error = ref("")
const message = ref("")
const decisionForm = reactive({
  reason_codes: "",
  notes: "",
})

async function load() {
  error.value = ""
  try {
    rows.value = await api<QueueItem[]>("/lender/bank-review-queue")
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function open(row: QueueItem) {
  selected.value = row
  workspace.value = null
  error.value = ""
  try {
    workspace.value = await api<Workspace>(
      `/lender/submissions/${row.submission_id}/workspace`,
    )
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function decide(decision: Decision) {
  if (!selected.value) return
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await api(`/lender/submissions/${selected.value.submission_id}/decisions`, {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
      body: JSON.stringify({
        expected_version: selected.value.version,
        decision,
        reason_codes: decisionForm.reason_codes
          .split(",")
          .map((code) => code.trim())
          .filter(Boolean),
        notes: decisionForm.notes || null,
      }),
    })
    message.value = `Decision recorded: ${decision}.`
    selected.value = null
    workspace.value = null
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">UNDERWRITING</span>
    <h2>Bank review queue</h2>
    <p class="muted">
      Submissions awaiting a decision, ordered oldest first. Bank analysis
      summaries are shown when available.
    </p>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="!rows.length" class="card">Nothing is waiting for review.</div>
    <div class="grid two">
      <article v-for="row in rows" :key="row.submission_id" class="card grid">
        <StatusBadge :status="row.status" />
        <strong>Application {{ row.application_id.slice(0, 8) }}</strong>
        <small>Requested {{ money(row.requested_amount) }} · monthly revenue {{ money(row.monthly_revenue) }}</small>
        <small v-if="row.analysis_available">
          Avg deposits {{ money(row.average_monthly_deposits) }} · NSF {{ row.nsf_count_90d ?? 0 }}
        </small>
        <small v-else>No bank analysis yet.</small>
        <small v-if="row.risk_flags.length" class="risk">Flags: {{ row.risk_flags.join(", ") }}</small>
        <button class="secondary" @click="open(row)">Review</button>
      </article>
    </div>

    <section v-if="selected" class="card review">
      <div>
        <span class="eyebrow">SELECTED SUBMISSION</span>
        <h3>Application {{ selected.application_id }}</h3>
      </div>
      <div v-if="!workspace" class="muted">Loading workspace…</div>
      <div v-else class="grid two">
        <div class="grid">
          <strong>Business</strong>
          <p v-if="workspace.business">
            {{ workspace.business.legal_name }} — {{ workspace.business.entity_type }},
            {{ workspace.business.industry }}
          </p>
          <p v-else class="muted">No business record yet.</p>
          <strong>Bank analysis</strong>
          <p v-if="workspace.bank_analysis">
            Avg deposits {{ money(workspace.bank_analysis.average_monthly_deposits) }} ·
            NSF {{ workspace.bank_analysis.nsf_count_90d ?? 0 }} ·
            trend {{ workspace.bank_analysis.revenue_trend || "unknown" }}
          </p>
          <p v-else class="muted">No bank analysis yet.</p>
          <strong>Open conditions</strong>
          <ul v-if="workspace.conditions.length">
            <li v-for="condition in workspace.conditions" :key="condition.id">
              {{ condition.description }} — <StatusBadge :status="condition.status" />
            </li>
          </ul>
          <p v-else class="muted">None.</p>
        </div>
        <div class="grid">
          <strong>Record a decision</strong>
          <label>
            Reason codes (comma separated)
            <input v-model="decisionForm.reason_codes" placeholder="LOW_DSCR, HIGH_NSF" />
          </label>
          <label>
            Notes
            <textarea v-model="decisionForm.notes" rows="3"></textarea>
          </label>
          <div class="grid two">
            <button :disabled="busy" @click="decide('APPROVE')">Approve</button>
            <button class="secondary" :disabled="busy" @click="decide('CONDITIONS')">
              Request conditions
            </button>
            <button class="secondary" :disabled="busy" @click="decide('DECLINE')">Decline</button>
            <button class="secondary" :disabled="busy" @click="decide('FRAUD_REVIEW')">
              Escalate — fraud
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.review {
  margin-top: 24px;
}
label {
  display: grid;
  gap: 7px;
  font-weight: 700;
}
input,
textarea {
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  font: inherit;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
.risk {
  color: var(--red, #b3261e);
  font-weight: 700;
}
</style>
