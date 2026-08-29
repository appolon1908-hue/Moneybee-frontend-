<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { api } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type QueueItem = {
  submission_id: string
  application_id: string
  status: string
}

type Condition = {
  id: string
  description: string
  status: string
  created_at: string
}

const rows = ref<QueueItem[]>([])
const selected = ref<QueueItem | null>(null)
const conditions = ref<Condition[]>([])
const newDescription = ref("")
const busy = ref(false)
const error = ref("")
const message = ref("")

const pendingSubmissions = computed(() =>
  rows.value.filter((row) => row.status === "CONDITIONS"),
)
const otherSubmissions = computed(() =>
  rows.value.filter((row) => row.status !== "CONDITIONS"),
)

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
  conditions.value = []
  error.value = ""
  try {
    const workspace = await api<{ conditions: Condition[] }>(
      `/lender/submissions/${row.submission_id}/workspace`,
    )
    conditions.value = workspace.conditions
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function run(action: () => Promise<unknown>, success: string) {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await action()
    message.value = success
    if (selected.value) await open(selected.value)
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busy.value = false
  }
}

function requestCondition() {
  if (!selected.value || newDescription.value.trim().length < 3) return
  return run(
    () =>
      api(`/lender/submissions/${selected.value?.submission_id}/conditions`, {
        method: "POST",
        body: JSON.stringify({ description: newDescription.value }),
      }),
    "Condition sent to the borrower.",
  ).then(() => {
    newDescription.value = ""
  })
}

function decideCondition(conditionId: string, verb: "approve" | "reject" | "waive") {
  return run(
    () => api(`/lender/conditions/${conditionId}/${verb}`, { method: "POST" }),
    `Condition ${verb === "approve" ? "approved" : verb === "reject" ? "rejected" : "waived"}.`,
  )
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">UNDERWRITING</span>
    <h2>Conditions</h2>
    <p class="muted">
      Submissions currently waiting on borrower conditions are listed first.
      Select any submission to request, approve, reject, or waive a condition.
    </p>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>

    <h3 v-if="pendingSubmissions.length">Waiting on conditions</h3>
    <div class="grid two">
      <article v-for="row in pendingSubmissions" :key="row.submission_id" class="card grid">
        <StatusBadge :status="row.status" />
        <strong>Application {{ row.application_id.slice(0, 8) }}</strong>
        <button class="secondary" @click="open(row)">Manage conditions</button>
      </article>
    </div>

    <details v-if="otherSubmissions.length">
      <summary>Other active submissions</summary>
      <div class="grid two">
        <article v-for="row in otherSubmissions" :key="row.submission_id" class="card grid">
          <StatusBadge :status="row.status" />
          <strong>Application {{ row.application_id.slice(0, 8) }}</strong>
          <button class="secondary" @click="open(row)">Manage conditions</button>
        </article>
      </div>
    </details>

    <section v-if="selected" class="card review">
      <div>
        <span class="eyebrow">SELECTED SUBMISSION</span>
        <h3>Application {{ selected.application_id }}</h3>
      </div>
      <div class="grid two">
        <div class="grid">
          <strong>Existing conditions</strong>
          <p v-if="!conditions.length" class="muted">None yet.</p>
          <article v-for="condition in conditions" :key="condition.id" class="card grid condition-row">
            <StatusBadge :status="condition.status" />
            <span>{{ condition.description }}</span>
            <div class="grid three" v-if="condition.status === 'BORROWER_ACTION_REQUIRED' || condition.status === 'SUBMITTED'">
              <button :disabled="busy" @click="decideCondition(condition.id, 'approve')">Approve</button>
              <button class="secondary" :disabled="busy" @click="decideCondition(condition.id, 'reject')">
                Reject
              </button>
              <button class="secondary" :disabled="busy" @click="decideCondition(condition.id, 'waive')">
                Waive
              </button>
            </div>
          </article>
        </div>
        <div class="grid">
          <strong>Request a new condition</strong>
          <label>
            Description
            <textarea v-model="newDescription" rows="4"></textarea>
          </label>
          <button :disabled="busy || newDescription.trim().length < 3" @click="requestCondition">
            Send to borrower
          </button>
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
textarea {
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  font: inherit;
}
.condition-row {
  gap: 10px;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
details {
  margin-top: 16px;
}
</style>
