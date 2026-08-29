<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  getActiveBorrowerApplication,
  getAuthContext,
  getBorrowerApplicationRequirements,
  type BorrowerApplicationRequirements,
} from "@moneybee/api-client"

const applicationId = ref("")
const requirements = ref<BorrowerApplicationRequirements | null>(null)
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  try {
    const context = await getAuthContext()
    const application = await getActiveBorrowerApplication(context.active_organization_id)
    applicationId.value = application?.id ?? ""
    requirements.value = applicationId.value
      ? await getBorrowerApplicationRequirements(applicationId.value, context.active_organization_id)
      : null
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">BORROWER PORTAL</span><h2>Your funding application</h2>
    <div v-if="loading" class="card">Loading progress…</div>
    <div v-else-if="!applicationId" class="card">No borrower application is available for this account.</div>
    <div v-else-if="error" class="card error">{{ error }}</div>
    <div v-else class="card grid">
      <strong>{{ requirements?.completion_percentage }}% complete</strong>
      <div class="progress"><span :style="{width: requirements?.completion_percentage + '%'}"></span></div>
      <div v-for="item in requirements?.requirements || []" :key="item.code">
        {{ item.complete ? "✓" : "○" }} {{ item.code.replaceAll("_", " ") }}
      </div>
      <RouterLink class="button" to="/application">Continue application</RouterLink>
    </div>
  </div>
</template>
