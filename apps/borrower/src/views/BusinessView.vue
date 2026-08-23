<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { ApiProblem, api } from "@moneybee/api-client"

type Business = {
  legal_name: string
  dba: string | null
  entity_type: string | null
  state_formed: string | null
  industry: string | null
  naics: string | null
  website: string | null
  address: Record<string, string>
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const busy = ref(false)
const message = ref("")
const error = ref("")
const business = reactive<Business>({
  legal_name: "",
  dba: null,
  entity_type: null,
  state_formed: null,
  industry: null,
  naics: null,
  website: null,
  address: {},
})

function describe(caught: unknown) {
  return caught instanceof Error ? caught.message : "Request failed"
}

onMounted(async () => {
  if (!applicationId) return
  try {
    Object.assign(
      business,
      await api<Business>(`/applications/${applicationId}/business`),
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
    await api(`/applications/${applicationId}/business`, {
      method: "PUT",
      body: JSON.stringify(business),
    })
    message.value = "Business information saved."
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="container">
    <span class="eyebrow">APPLICATION · BUSINESS</span>
    <h2>Business information</h2>
    <p class="lede">Tell us about the legal business requesting funding.</p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <section v-else class="card section">
      <div v-if="message" class="notice" role="status">{{ message }}</div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div class="form-grid">
        <label>Legal name<input v-model="business.legal_name" autocomplete="organization" /></label>
        <label>DBA<input v-model="business.dba" autocomplete="organization" /></label>
        <label>
          Entity type
          <select v-model="business.entity_type">
            <option :value="null">Select</option>
            <option>LLC</option><option>CORPORATION</option>
            <option>PARTNERSHIP</option><option>SOLE_PROPRIETORSHIP</option>
          </select>
        </label>
        <label>State formed<input v-model="business.state_formed" maxlength="2" placeholder="FL" /></label>
        <label>Industry<input v-model="business.industry" /></label>
        <label>NAICS<input v-model="business.naics" maxlength="12" /></label>
        <label>Website<input v-model="business.website" type="url" autocomplete="url" /></label>
      </div>
      <button :disabled="busy || !business.legal_name" @click="save">
        {{ busy ? "Saving…" : "Save business" }}
      </button>
    </section>
  </main>
</template>
