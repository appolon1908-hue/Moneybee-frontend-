<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue"
import {
  financeApi,
  money,
  type AccountType,
  type JournalEntry,
  type LedgerAccount,
  type TrialBalance,
} from "@moneybee/api-client"
import { AUTH_MANAGER, type LocalPrincipal } from "@moneybee/auth"

const auth = inject(AUTH_MANAGER)
const principal = ref<LocalPrincipal | null>(null)
const accounts = ref<LedgerAccount[]>([])
const journalEntries = ref<JournalEntry[]>([])
const trial = ref<TrialBalance | null>(null)
const busy = ref(false)
const error = ref("")
const notice = ref("")

const newAccount = ref({ code: "", name: "", account_type: "ASSET" as AccountType })
const journal = ref({ description: "", amount: "", debitAccountId: "", creditAccountId: "" })

const canManage = computed(() => Boolean(
  principal.value?.permissions.includes("*") || principal.value?.permissions.includes("finance.manage"),
))
const canPost = computed(() => Boolean(
  principal.value?.permissions.includes("*") || principal.value?.permissions.includes("finance.post"),
))

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Request failed"
}

async function refresh() {
  accounts.value = await financeApi.accounts()
  trial.value = await financeApi.trialBalance()
  journalEntries.value = await financeApi.journalEntries()
}

async function createAccount() {
  busy.value = true
  error.value = ""
  notice.value = ""
  try {
    await financeApi.createAccount({
      code: newAccount.value.code.trim(),
      name: newAccount.value.name.trim(),
      account_type: newAccount.value.account_type,
      currency: "USD",
    })
    newAccount.value.code = ""
    newAccount.value.name = ""
    notice.value = "Ledger account created."
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

async function postJournal() {
  busy.value = true
  error.value = ""
  notice.value = ""
  try {
    await financeApi.postJournal({
      idempotency_key: crypto.randomUUID(),
      source_type: "MANUAL_ADMIN",
      description: journal.value.description.trim(),
      currency: "USD",
      effective_at: new Date().toISOString(),
      postings: [
        { account_id: journal.value.debitAccountId, side: "DEBIT", amount: journal.value.amount },
        { account_id: journal.value.creditAccountId, side: "CREDIT", amount: journal.value.amount },
      ],
    })
    journal.value = { description: "", amount: "", debitAccountId: "", creditAccountId: "" }
    notice.value = "Balanced journal entry posted. No external funds were moved."
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    principal.value = await auth?.getLocalPrincipal() || null
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  }
})
</script>

<template>
  <main class="container">
    <span class="eyebrow">CONTROL CENTER · FINANCE</span>
    <h2>Financial ledger</h2>
    <p class="lede">
      Tenant-scoped double-entry accounting for MoneyBee records. Journal entries record accounting events only; this screen cannot send money.
    </p>

    <div v-if="notice" class="notice" role="status">{{ notice }}</div>
    <div v-if="error" class="error" role="alert">{{ error }}</div>

    <section class="card section">
      <div class="metric-grid">
        <div><span class="eyebrow">DEBITS</span><strong>{{ money(trial?.debit_total) }}</strong></div>
        <div><span class="eyebrow">CREDITS</span><strong>{{ money(trial?.credit_total) }}</strong></div>
        <div><span class="eyebrow">CONTROL</span><strong>{{ trial?.balanced ? "Balanced" : "Review required" }}</strong></div>
        <div><span class="eyebrow">ACCOUNTS</span><strong>{{ accounts.length }}</strong></div>
      </div>
    </section>

    <section v-if="canManage" class="card section">
      <h3>Chart of accounts</h3>
      <div class="form-grid">
        <label>Code<input v-model="newAccount.code" maxlength="40" placeholder="1000" /></label>
        <label>Name<input v-model="newAccount.name" maxlength="200" placeholder="Operating cash" /></label>
        <label>Type
          <select v-model="newAccount.account_type">
            <option>ASSET</option><option>LIABILITY</option><option>EQUITY</option><option>REVENUE</option><option>EXPENSE</option>
          </select>
        </label>
      </div>
      <button :disabled="busy || !newAccount.code || !newAccount.name" @click="createAccount">Create account</button>
    </section>

    <section v-if="canPost" class="card section">
      <h3>Record a balanced journal</h3>
      <div class="form-grid">
        <label>Description<input v-model="journal.description" maxlength="2000" /></label>
        <label>Amount<input v-model="journal.amount" inputmode="decimal" type="number" min="0.01" step="0.01" /></label>
        <label>Debit account
          <select v-model="journal.debitAccountId"><option value="">Select</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.code }} · {{ account.name }}</option></select>
        </label>
        <label>Credit account
          <select v-model="journal.creditAccountId"><option value="">Select</option><option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.code }} · {{ account.name }}</option></select>
        </label>
      </div>
      <button :disabled="busy || !journal.description || !journal.amount || !journal.debitAccountId || !journal.creditAccountId" @click="postJournal">
        {{ busy ? "Posting…" : "Post journal entry" }}
      </button>
    </section>

    <section class="card section">
      <h3>Trial balance</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Account</th><th>Type</th><th>Debits</th><th>Credits</th><th>Net</th></tr></thead>
          <tbody>
            <tr v-for="line in trial?.accounts || []" :key="line.account_id">
              <td>{{ line.code }} · {{ line.name }}</td><td>{{ line.account_type }}</td><td>{{ money(line.debit_total) }}</td><td>{{ money(line.credit_total) }}</td><td>{{ money(line.balance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card section">
      <h3>Recent journal entries</h3>
      <div v-for="entry in journalEntries.slice(0, 20)" :key="entry.id" class="list-row">
        <div><strong>{{ entry.entry_number }}</strong><p>{{ entry.description }}</p></div>
        <div><span>{{ entry.status }}</span><p>{{ new Date(entry.effective_at).toLocaleString() }}</p></div>
      </div>
    </section>
  </main>
</template>
