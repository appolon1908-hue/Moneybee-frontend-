<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api } from "@moneybee/api-client"

type Condition = {
  id: string
  description: string
  status: string
  created_at: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const rows = ref<Condition[]>([])
const busy = ref(false)
const error = ref("")
const message = ref("")

async function load() {
  if (!applicationId) return
  error.value = ""
  try {
    rows.value = await api<Condition[]>(
      `/applications/${applicationId}/conditions`,
    )
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function submit(conditionId: string) {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await api(`/conditions/${conditionId}/submit`, {method: "POST"})
    message.value = "Condition submitted for lender review."
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
    <h2>Conditions</h2>
    <p class="muted">
      Review outstanding lender requests. Secure document collection remains
      unavailable until approved private object storage is configured.
    </p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="applicationId && !rows.length" class="card">
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
</style>
