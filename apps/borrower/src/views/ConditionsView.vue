<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  getAuthContext,
  getBorrowerWorkspace,
  listBorrowerApplicationConditions,
  submitBorrowerCondition,
  type BorrowerApplication,
  type BorrowerCondition,
} from "@moneybee/api-client"

const organizationId = ref("")
const applicationId = ref("")
const applications = ref<BorrowerApplication[]>([])
const rows = ref<BorrowerCondition[]>([])
const busy = ref(false)
const loading = ref(true)
const error = ref("")
const message = ref("")

async function load() {
  loading.value = true
  error.value = ""
  try {
    const context = await getAuthContext()
    organizationId.value = context.active_organization_id ?? ""
    const workspace = await getBorrowerWorkspace(organizationId.value)
    applications.value = workspace.applications
    applicationId.value = applicationId.value || applications.value[0]?.id || ""
    await loadConditions()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loading.value = false
  }
}

async function loadConditions() {
  rows.value = applicationId.value
    ? await listBorrowerApplicationConditions(applicationId.value, organizationId.value)
    : []
}

async function changeApplication() {
  error.value = ""
  message.value = ""
  try {
    await loadConditions()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function submit(conditionId: string) {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await submitBorrowerCondition(conditionId, organizationId.value)
    message.value = "Condition submitted for lender review."
    await loadConditions()
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
    <h2>Conditions</h2>
    <p class="muted">
      Review outstanding lender requests. Secure document collection remains
      unavailable until approved private object storage is configured.
    </p>
    <label v-if="applications.length" class="card selector">
      Application
      <select v-model="applicationId" @change="changeApplication">
        <option
          v-for="application in applications"
          :key="application.id"
          :value="application.id"
        >
          {{ application.status.replaceAll("_", " ") }} · {{ application.application_number }}
        </option>
      </select>
    </label>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="loading" class="card">Loading conditions…</div>
    <div v-else-if="!applicationId" class="card error">
      No borrower application is available for this account.
    </div>
    <div v-else-if="!rows.length" class="card">
      No underwriting conditions are outstanding.
    </div>
    <div class="grid two">
      <article v-for="row in rows" :key="row.id" class="card grid">
        <span class="eyebrow">{{ row.status.replaceAll("_", " ") }}</span>
        <strong>{{ row.description }}</strong>
        <button
          v-if="['BORROWER_ACTION_REQUIRED', 'REJECTED'].includes(row.status)"
          :disabled="busy"
          @click="submit(row.id)"
        >
          Mark ready for review
        </button>
      </article>
    </div>
  </main>
</template>

<style scoped>
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
.selector {
  display: grid;
  gap: 0.5rem;
  font-weight: 700;
}
.selector select {
  min-height: 44px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  font: inherit;
}
</style>
