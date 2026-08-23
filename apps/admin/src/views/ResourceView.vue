<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { api } from "@moneybee/api-client"

const props = defineProps<{title: string; endpoint: string; description: string}>()
const rows = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref("")

const columns = computed(() => {
  const first = rows.value[0]
  return first ? Object.keys(first).slice(0, 8) : []
})

function format(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value).replaceAll("_", " ")
}

async function load() {
  loading.value = true
  error.value = ""
  try {
    rows.value = await api<Record<string, unknown>[]>(props.endpoint)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loading.value = false
  }
}

watch(() => props.endpoint, load, {immediate: true})
</script>

<template>
  <main class="container">
    <span class="eyebrow">ADMIN CATALOG</span>
    <h2>{{ title }}</h2>
    <p class="lede">{{ description }}</p>
    <div v-if="loading" class="card">Loading records…</div>
    <div v-else-if="error" class="card error" role="alert">{{ error }}</div>
    <section v-else class="card table-card">
      <div class="section-heading">
        <strong>{{ rows.length }} records</strong>
        <span class="muted">Read-only</span>
      </div>
      <p v-if="!rows.length" class="muted">No records yet.</p>
      <table v-else>
        <thead><tr><th v-for="column in columns" :key="column">{{ format(column) }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="String(row.id || index)">
            <td v-for="column in columns" :key="column" :title="format(row[column])">
              {{ format(row[column]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.table-card { overflow-x: auto; }
td { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
