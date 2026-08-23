<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api } from "@moneybee/api-client"
const query = useQuery({queryKey: ["crm-events"], queryFn: () => api<any[]>("/admin/crm/events")})
</script>
<template><div class="container"><span class="eyebrow">INTEGRATIONS</span><h2>CRM event health</h2>
  <table><thead><tr><th>Event</th><th>Status</th><th>Attempts</th><th>Error</th></tr></thead>
  <tbody><tr v-for="event in query.data.value || []" :key="event.id"><td>{{ event.event_type }}</td>
  <td>{{ event.status }}</td><td>{{ event.attempt_count }}</td><td>{{ event.last_error || "—" }}</td></tr></tbody></table>
</div></template>
