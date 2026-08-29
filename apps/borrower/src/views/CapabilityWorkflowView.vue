<script setup lang="ts">
import { onMounted, ref } from "vue"
import { getCapabilityFlags } from "@moneybee/api-client"

const props = defineProps<{
  eyebrow: string
  title: string
  description: string
  capability?: string
}>()

const ready = ref(false)
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  try {
    if (!props.capability) return
    const capabilities = await getCapabilityFlags()
    ready.value = Boolean(capabilities[props.capability])
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="container">
    <span class="eyebrow">{{ eyebrow }}</span>
    <h2>{{ title }}</h2>
    <p class="lede">{{ description }}</p>
    <section class="card">
      <div v-if="loading">Checking provider readiness…</div>
      <div v-else-if="error" class="error" role="alert">{{ error }}</div>
      <template v-else-if="ready">
        <strong class="success">Provider-ready</strong>
        <p class="muted">
          This capability is enabled and its configured provider passed backend
          readiness checks.
        </p>
      </template>
      <template v-else>
        <strong>Not available yet</strong>
        <p class="muted">
          No information is being collected here until an approved provider is
          configured, enabled, and healthy.
        </p>
      </template>
    </section>
  </main>
</template>
