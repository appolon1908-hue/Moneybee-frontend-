<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import {
  ApiProblem,
  getActiveBorrowerApplication,
  getAuthContext,
  getBorrowerBusinessProfile,
  saveBorrowerBusinessProfile,
} from "@moneybee/api-client"

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

const organizationId = ref("")
const applicationId = ref("")
const loading = ref(true)
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

async function load() {
  loading.value = true
  error.value = ""
  try {
    const context = await getAuthContext()
    organizationId.value = context.active_organization_id ?? ""
    const application = await getActiveBorrowerApplication(organizationId.value)
    applicationId.value = application?.id ?? ""
    if (!applicationId.value) return
    Object.assign(business, await getBorrowerBusinessProfile(applicationId.value, organizationId.value))
  } catch (caught) {
    if (!(caught instanceof ApiProblem && caught.status === 404)) {
      error.value = describe(caught)
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await saveBorrowerBusinessProfile(applicationId.value, business, organizationId.value)
    message.value = "Business information saved."
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">APPLICATION · BUSINESS</span>
    <h2>Business information</h2>
    <p class="lede">Tell us about the legal business requesting funding.</p>
    <div v-if="loading" class="card">
      Loading business profile…
    </div>
    <div v-else-if="!applicationId" class="card error">
      No borrower application is available for this account.
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
