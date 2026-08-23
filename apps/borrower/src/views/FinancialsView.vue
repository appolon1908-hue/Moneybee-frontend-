<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { ApiProblem, api } from "@moneybee/api-client"

type FinancialProfile = {
  annual_revenue: number | null
  monthly_revenue: number | null
  monthly_expenses: number | null
  existing_debt: number | null
  existing_positions: number
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const busy = ref(false)
const message = ref("")
const error = ref("")
const financials = reactive<FinancialProfile>({
  annual_revenue: null,
  monthly_revenue: null,
  monthly_expenses: null,
  existing_debt: null,
  existing_positions: 0,
})

function describe(caught: unknown) {
  return caught instanceof Error ? caught.message : "Request failed"
}

onMounted(async () => {
  if (!applicationId) return
  try {
    Object.assign(
      financials,
      await api<FinancialProfile>(
        `/applications/${applicationId}/financial-profile`,
      ),
    )
  } catch (caught) {
    if (!(caught instanceof ApiProblem && caught.status === 404)) {
      error.value = describe(caught)
    }
  }
})

async function save() {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await api(`/applications/${applicationId}/financial-profile`, {
      method: "PUT",
      body: JSON.stringify(financials),
    })
    message.value = "Financial profile saved."
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="container">
    <span class="eyebrow">APPLICATION · FINANCIALS</span>
    <h2>Financial profile</h2>
    <p class="lede">Use current business figures. Values can be updated before submission.</p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <section v-else class="card section">
      <div v-if="message" class="notice" role="status">{{ message }}</div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div class="form-grid">
        <label>Annual revenue<input v-model.number="financials.annual_revenue" type="number" min="0" /></label>
        <label>Monthly revenue<input v-model.number="financials.monthly_revenue" type="number" min="0" /></label>
        <label>Monthly expenses<input v-model.number="financials.monthly_expenses" type="number" min="0" /></label>
        <label>Existing debt<input v-model.number="financials.existing_debt" type="number" min="0" /></label>
        <label>Existing positions<input v-model.number="financials.existing_positions" type="number" min="0" /></label>
      </div>
      <button :disabled="busy" @click="save">
        {{ busy ? "Saving…" : "Save financials" }}
      </button>
    </section>
  </main>
</template>
