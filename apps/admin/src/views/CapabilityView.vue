<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { api, ENDPOINTS } from "@moneybee/api-client"

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

type ReadinessReport = {
  FINAL_STATUS: "READY" | "PARTIAL"
  ENVIRONMENT: string
  SOURCE_SHA: string | null
  MIGRATION_HEAD: string | null
  OUTBOX_STATUS: string
  INBOX_STATUS: string
  OUTBOX_PENDING: number
  INBOX_PENDING: number
  OPEN_OPERATIONAL_EXCEPTIONS: number
  BACKUP_STATUS: string
  RESTORE_STATUS: string
  STAGING_STATUS: string
  BLOCKERS: string[]
  NEXT_SAFE_ACTION: string
}

const capabilities = useQuery({
  queryKey: ["admin-capabilities"],
  queryFn: () => api<Capability[]>(ENDPOINTS.admin.capabilities),
})
const providers = useQuery({
  queryKey: ["admin-provider-connections"],
  queryFn: () => api<ProviderConnection[]>(ENDPOINTS.admin.providerConnections),
})
const readiness = useQuery({
  queryKey: ["admin-system-readiness"],
  queryFn: () => api<ReadinessReport>(ENDPOINTS.admin.systemReadiness),
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

    <div
      v-if="capabilities.error.value || providers.error.value || readiness.error.value"
      class="card error"
    >
      Capability information is unavailable.
    </div>

    <section v-if="readiness.data.value" class="section">
      <div class="section-heading">
        <div>
          <h3>Production readiness</h3>
          <p class="muted">
            {{ readiness.data.value.ENVIRONMENT }} · source
            {{ readiness.data.value.SOURCE_SHA?.slice(0, 12) || "not recorded" }}
          </p>
        </div>
        <span class="eyebrow">{{ readiness.data.value.FINAL_STATUS }}</span>
      </div>
      <div class="grid three">
        <article class="card">
          <strong>Integration reliability</strong>
          <p class="muted">
            Outbox {{ readiness.data.value.OUTBOX_STATUS }} ·
            {{ readiness.data.value.OUTBOX_PENDING }} pending
          </p>
          <p class="muted">
            Inbox {{ readiness.data.value.INBOX_STATUS }} ·
            {{ readiness.data.value.INBOX_PENDING }} pending
          </p>
        </article>
        <article class="card">
          <strong>Recovery evidence</strong>
          <p class="muted">Backup {{ readiness.data.value.BACKUP_STATUS }}</p>
          <p class="muted">Restore {{ readiness.data.value.RESTORE_STATUS }}</p>
          <p class="muted">Staging {{ readiness.data.value.STAGING_STATUS }}</p>
        </article>
        <article class="card">
          <strong>Open exceptions</strong>
          <div class="metric">{{ readiness.data.value.OPEN_OPERATIONAL_EXCEPTIONS }}</div>
        </article>
      </div>
      <div class="card">
        <strong>Next safe action</strong>
        <p>{{ readiness.data.value.NEXT_SAFE_ACTION }}</p>
        <details>
          <summary>{{ readiness.data.value.BLOCKERS.length }} blockers</summary>
          <ul>
            <li v-for="blocker in readiness.data.value.BLOCKERS" :key="blocker">
              {{ blocker }}
            </li>
          </ul>
        </details>
      </div>
    </section>

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
