<script setup lang="ts">
import { computed } from "vue"
import { useQuery } from "@tanstack/vue-query"
import { getAuthContext, listLenderPrograms } from "@moneybee/api-client"
const query = useQuery({
  queryKey: ["lender-programs"],
  queryFn: async () => {
    const context = await getAuthContext()
    return listLenderPrograms(true, context.active_organization_id)
  },
})
const programs = computed(() => query.data.value || [])
</script>
<template><div class="container"><span class="eyebrow">MONEYBEE PARTNER NETWORK</span><h2>Lender workspace</h2>
  <div class="grid three"><div class="card"><div class="muted">Programs</div><div class="metric">{{ programs.length }}</div></div>
  <div class="card"><div class="muted">Needs review</div><div class="metric">0</div></div>
  <div class="card"><div class="muted">Offers out</div><div class="metric">0</div></div></div>
  <section class="section"><h2>Active programs</h2><table><thead><tr><th>Name</th><th>Product</th><th>Version</th></tr></thead>
  <tbody><tr v-for="program in programs" :key="program.id"><td>{{ program.name }}</td><td>{{ program.product_type }}</td><td>{{ program.version }}</td></tr></tbody></table>
  <div v-if="query.error.value" class="card error">{{ query.error.value }}</div></section>
</div></template>
