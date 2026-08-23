<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api } from "@moneybee/api-client"
const lenderId = import.meta.env.VITE_DEMO_LENDER_ID || ""
const query = useQuery({
  queryKey: ["programs", lenderId],
  queryFn: () => api<any[]>("/lenders/" + lenderId + "/programs"),
  enabled: Boolean(lenderId),
})
</script>
<template><div class="container"><span class="eyebrow">MONEYBEE PARTNER NETWORK</span><h2>Lender workspace</h2>
  <div class="grid three"><div class="card"><div class="muted">Programs</div><div class="metric">{{ query.data.value?.length || 0 }}</div></div>
  <div class="card"><div class="muted">Needs review</div><div class="metric">0</div></div>
  <div class="card"><div class="muted">Offers out</div><div class="metric">0</div></div></div>
  <section class="section"><h2>Active programs</h2><table><thead><tr><th>Name</th><th>Product</th><th>Version</th></tr></thead>
  <tbody><tr v-for="program in query.data.value || []" :key="program.id"><td>{{ program.name }}</td><td>{{ program.product_type }}</td><td>{{ program.version }}</td></tr></tbody></table>
  <div v-if="!lenderId" class="card">Set VITE_DEMO_LENDER_ID for local development.</div></section>
</div></template>
