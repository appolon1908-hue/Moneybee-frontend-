<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api } from "@moneybee/api-client"

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const query = useQuery({
  queryKey: ["requirements", applicationId],
  queryFn: () => api("/applications/" + applicationId + "/requirements"),
  enabled: Boolean(applicationId),
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">BORROWER PORTAL</span><h2>Your funding application</h2>
    <div v-if="!applicationId" class="card">Set VITE_DEMO_APPLICATION_ID after creating a local application.</div>
    <div v-else-if="query.isPending.value" class="card">Loading progress…</div>
    <div v-else-if="query.error.value" class="card error">{{ query.error.value }}</div>
    <div v-else class="card grid">
      <strong>{{ (query.data.value as any)?.completion_percentage }}% complete</strong>
      <div class="progress"><span :style="{width: (query.data.value as any)?.completion_percentage + '%'}"></span></div>
      <div v-for="item in (query.data.value as any)?.requirements" :key="item.code">
        {{ item.complete ? "✓" : "○" }} {{ item.code.replaceAll("_", " ") }}
      </div>
      <RouterLink class="button" to="/application">Continue application</RouterLink>
    </div>
  </div>
</template>
