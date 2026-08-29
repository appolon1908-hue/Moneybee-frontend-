<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api, ENDPOINTS } from "@moneybee/api-client"
const query = useQuery({queryKey: ["admin-dashboard"], queryFn: () => api<any>(ENDPOINTS.admin.dashboard)})
</script>
<template><div class="container"><span class="eyebrow">OPERATIONS</span><h2>MoneyBee control center</h2>
  <div v-if="query.error.value" class="card error">{{ query.error.value }}</div>
  <div class="grid three"><div class="card"><div class="muted">Leads</div><div class="metric">{{ query.data.value?.leads || 0 }}</div></div>
  <div class="card"><div class="muted">Applications</div><div class="metric">{{ query.data.value?.applications || 0 }}</div></div>
  <div class="card"><div class="muted">Offers</div><div class="metric">{{ query.data.value?.offers || 0 }}</div></div>
  <div class="card"><div class="muted">Funded</div><div class="metric">{{ query.data.value?.funded || 0 }}</div></div></div>
</div></template>
