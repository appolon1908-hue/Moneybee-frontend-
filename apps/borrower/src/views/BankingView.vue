<script setup lang="ts">
import { onMounted, ref } from "vue"
import {
  api,
  bankingApi,
  loadPlaid,
  money,
  type BankAccount,
  type BankAnalysis,
} from "@moneybee/api-client"

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const capabilityReady = ref(false)
const loading = ref(true)
const busy = ref(false)
const accounts = ref<BankAccount[]>([])
const analysis = ref<BankAnalysis | null>(null)
const message = ref("")
const error = ref("")

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Request failed"
}

async function refresh() {
  if (!applicationId || !capabilityReady.value) return
  ;[accounts.value, analysis.value] = await Promise.all([
    bankingApi.accounts(applicationId),
    bankingApi.analysis(applicationId),
  ])
}

onMounted(async () => {
  try {
    const capabilities = await api<Record<string, boolean>>("/me/capabilities")
    capabilityReady.value = Boolean(capabilities["bank.live_connection"])
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    loading.value = false
  }
})

async function connect() {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    const session = await bankingApi.createLinkSession(applicationId)
    if (session.provider !== "plaid") {
      throw new Error("The configured browser banking provider is unsupported")
    }
    await loadPlaid()
    if (!window.Plaid) throw new Error("Plaid Link is unavailable")

    const handler = window.Plaid.create({
      token: session.link_token,
      onSuccess: async (publicToken) => {
        try {
          await bankingApi.exchange(applicationId, publicToken)
          await bankingApi.sync(applicationId)
          await refresh()
          message.value = "Bank account connected successfully."
        } catch (caught) {
          error.value = describe(caught)
        } finally {
          handler.destroy()
        }
      },
      onExit: (caught) => {
        if (caught) error.value = "Bank connection was not completed."
        handler.destroy()
      },
    })
    handler.open()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

async function sync() {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await bankingApi.sync(applicationId)
    await refresh()
    message.value = "Bank information synchronized."
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="container">
    <span class="eyebrow">APPLICATION · BANKING</span>
    <div class="section-heading">
      <div>
        <h2>Business banking</h2>
        <p class="lede">
          Connect through the approved provider. MoneyBee stores encrypted provider
          credentials and normalized financial records.
        </p>
      </div>
      <div v-if="capabilityReady" class="actions">
        <button class="secondary" :disabled="busy" @click="sync">Sync</button>
        <button :disabled="busy" @click="connect">Connect bank</button>
      </div>
    </div>

    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <div v-else-if="loading" class="card">Checking provider readiness…</div>
    <div v-else-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-else-if="!capabilityReady" class="card">
      <strong>Not available yet</strong>
      <p class="muted">
        Banking stays closed until the backend capability is enabled and its provider
        is configured and healthy.
      </p>
    </div>
    <template v-else>
      <div v-if="message" class="card notice" role="status">{{ message }}</div>
      <section v-if="analysis" class="grid three">
        <div class="card"><span class="muted">Monthly deposits</span><div class="metric">{{ money(analysis.average_monthly_deposits) }}</div></div>
        <div class="card"><span class="muted">Average balance</span><div class="metric">{{ money(analysis.average_daily_balance) }}</div></div>
        <div class="card"><span class="muted">Deposits, 90 days</span><div class="metric">{{ analysis.deposit_count_90d }}</div></div>
        <div class="card"><span class="muted">NSF, 90 days</span><div class="metric">{{ analysis.nsf_count_90d }}</div></div>
      </section>
      <section class="card table-card">
        <h3>Connected accounts</h3>
        <p v-if="!accounts.length" class="muted">No connected accounts yet.</p>
        <table v-else>
          <thead><tr><th>Account</th><th>Type</th><th>Mask</th><th>Balance</th></tr></thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ account.subtype || account.account_type || "—" }}</td>
              <td>•••• {{ account.mask || "—" }}</td>
              <td>{{ money(account.current_balance) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: 10px; }
.table-card { margin-top: 24px; overflow-x: auto; }
</style>
