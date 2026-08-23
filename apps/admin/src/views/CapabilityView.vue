<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api } from "@moneybee/api-client"

type Capability = {
  id: string
  key: string
  environment: string
  enabled: boolean
  provider: string | null
  provider_ready: boolean
  reason: string | null
}

type ProviderConnection = {
  id: string
  provider_type: string
  provider_name: string
  environment: string
  status: string
}

const capabilities = useQuery({
  queryKey: ["admin-capabilities"],
  queryFn: () => api<Capability[]>("/admin/capabilities"),
})
const providers = useQuery({
  queryKey: ["admin-provider-connections"],
  queryFn: () => api<ProviderConnection[]>("/admin/provider-connections"),
})
</script>

<template>
  <div class="container">
    <span class="eyebrow">PRODUCTION SAFETY</span>
    <h2>Capabilities and provider readiness</h2>
    <p class="lede">
      A live action remains unavailable until its capability is enabled and its provider is ready.
      This view is read-only.
    </p>

    <div v-if="capabilities.error.value || providers.error.value" class="card error">
      Capability information is unavailable.
    </div>

    <section class="section">
      <h3>Capability flags</h3>
      <div class="grid three">
        <article v-for="item in capabilities.data.value || []" :key="item.id" class="card">
          <strong>{{ item.key }}</strong>
          <p class="muted">{{ item.environment }} · {{ item.provider || "internal" }}</p>
          <span class="eyebrow">
            {{ item.enabled && item.provider_ready ? "AVAILABLE" : "DISABLED" }}
          </span>
          <p v-if="item.reason" class="muted">{{ item.reason }}</p>
        </article>
      </div>
    </section>

    <section class="section">
      <h3>Provider connections</h3>
      <div class="grid three">
        <article v-for="provider in providers.data.value || []" :key="provider.id" class="card">
          <strong>{{ provider.provider_name }}</strong>
          <p class="muted">{{ provider.provider_type }} · {{ provider.environment }}</p>
          <span class="eyebrow">{{ provider.status }}</span>
        </article>
      </div>
      <p v-if="!providers.isPending.value && !providers.data.value?.length" class="muted">
        No provider connection has been configured for this environment.
      </p>
    </section>
  </div>
</template>
