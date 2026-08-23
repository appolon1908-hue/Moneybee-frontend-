<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listApplications, type Application } from '../api'
const rows = ref<Application[]>([])
const error = ref('')
onMounted(async () => { try { rows.value = await listApplications() } catch (e) { error.value = e instanceof Error ? e.message : 'Unable to load' } })
</script>
<template>
  <section class="panel">
    <h1>Operations</h1><p v-if="error" class="error">{{ error }}</p>
    <div class="table-wrap"><table><thead><tr><th>Business</th><th>Contact</th><th>Amount</th><th>Status</th></tr></thead><tbody>
      <tr v-for="row in rows" :key="row.id"><td>{{ row.company_name }}</td><td>{{ row.contact_name }}</td><td>${{ row.requested_amount.toLocaleString() }}</td><td>{{ row.status }}</td></tr>
    </tbody></table></div>
  </section>
</template>
