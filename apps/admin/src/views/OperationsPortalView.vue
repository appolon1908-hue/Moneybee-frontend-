<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  adminPortalApi,
  portalApi,
  type AdminOperationsWorkspace,
  type OrganizationContext,
  type PortalContext,
  type PortalTask,
  type SearchResult,
  type WebhookReceipt,
} from '@moneybee/api-client'

type Tab = 'queue' | 'search' | 'integrations' | 'organizations' | 'audit'

const activeTab = ref<Tab>('queue')
const loading = ref(true)
const actionPending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const context = ref<PortalContext | null>(null)
const workspace = ref<AdminOperationsWorkspace | null>(null)
const workQueue = ref<PortalTask[]>([])
const queueStatus = ref('')
const queuePriority = ref('')
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searching = ref(false)
const integrationHealth = ref<Record<string, unknown>>({})
const webhookReceipts = ref<WebhookReceipt[]>([])
const webhookProvider = ref('')
const webhookStatus = ref('')
const organizations = ref<OrganizationContext[]>([])
const organizationType = ref('')
const selectedOrganizationId = ref('')
const organizationMembers = ref<Array<Record<string, unknown>>>([])
const auditEvents = ref<Array<Record<string, unknown>>>([])
const auditNextBefore = ref<string | null>(null)

const organizationId = computed(() => context.value?.active_organization_id ?? null)
const metrics = computed(() => workspace.value?.metrics ?? {})
const globalScope = computed(() => Boolean(workspace.value?.principal.global_scope))

function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'MoneyBee operations could not complete that request.'
}

function clearMessages(): void {
  errorMessage.value = ''
  successMessage.value = ''
}

function value(record: Record<string, unknown>, key: string, fallback = '—'): string {
  const candidate = record[key]
  if (candidate === null || candidate === undefined || candidate === '') return fallback
  return String(candidate)
}

function formatDate(candidate: unknown): string {
  if (!candidate) return '—'
  const date = new Date(String(candidate))
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function metric(name: string): number {
  return Number(metrics.value[name] ?? 0)
}

async function loadWorkspace(): Promise<void> {
  loading.value = true
  clearMessages()
  try {
    const nextContext = await portalApi.context()
    context.value = nextContext
    const nextWorkspace = await adminPortalApi.workspace(
      nextContext.active_organization_id,
    )
    workspace.value = nextWorkspace
    workQueue.value = nextWorkspace.work_queue
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    loading.value = false
  }
}

async function loadWorkQueue(): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const response = await adminPortalApi.workQueue(
      {
        status: queueStatus.value || undefined,
        priority: queuePriority.value || undefined,
        limit: 250,
      },
      organizationId.value,
    )
    workQueue.value = response.items
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function updateTask(
  task: PortalTask,
  input: Partial<Pick<PortalTask, 'status' | 'priority'>>,
): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    await adminPortalApi.patchWorkItem(
      task.id,
      {
        status: input.status as
          | 'OPEN'
          | 'IN_PROGRESS'
          | 'BLOCKED'
          | 'COMPLETED'
          | 'CANCELLED'
          | undefined,
        priority: input.priority as
          | 'LOW'
          | 'NORMAL'
          | 'HIGH'
          | 'URGENT'
          | undefined,
        version: task.version,
      },
      organizationId.value,
    )
    successMessage.value = 'Work item updated.'
    await Promise.all([loadWorkspace(), loadWorkQueue()])
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function runSearch(): Promise<void> {
  if (!organizationId.value || searchQuery.value.trim().length < 2) return
  searching.value = true
  clearMessages()
  try {
    const response = await adminPortalApi.search(
      searchQuery.value.trim(),
      organizationId.value,
    )
    searchResults.value = response.items
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    searching.value = false
  }
}

async function loadIntegrations(): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const [health, receipts] = await Promise.all([
      adminPortalApi.integrationHealth(organizationId.value),
      adminPortalApi.webhookReceipts(
        {
          provider: webhookProvider.value || undefined,
          status: webhookStatus.value || undefined,
          limit: 250,
        },
        organizationId.value,
      ),
    ])
    integrationHealth.value = health
    webhookReceipts.value = receipts.items
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function requeueReceipt(receipt: WebhookReceipt): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    await adminPortalApi.requeueWebhookReceipt(receipt.id, organizationId.value)
    successMessage.value = 'Webhook receipt requeued for controlled processing.'
    await loadIntegrations()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function loadOrganizations(): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const response = await adminPortalApi.organizations(
      { organization_type: organizationType.value || undefined },
      organizationId.value,
    )
    organizations.value = response.items
    if (
      selectedOrganizationId.value &&
      !response.items.some((item) => item.id === selectedOrganizationId.value)
    ) {
      selectedOrganizationId.value = ''
      organizationMembers.value = []
    }
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function loadOrganizationMembers(targetOrganizationId: string): Promise<void> {
  if (!organizationId.value || !targetOrganizationId) return
  selectedOrganizationId.value = targetOrganizationId
  actionPending.value = true
  clearMessages()
  try {
    const response = await adminPortalApi.organizationMembers(
      targetOrganizationId,
      organizationId.value,
    )
    organizationMembers.value = response.items
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function loadAudit(reset = true): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const response = await adminPortalApi.auditEvents(
      reset ? null : auditNextBefore.value,
      organizationId.value,
    )
    auditEvents.value = reset
      ? response.items
      : [...auditEvents.value, ...response.items]
    auditNextBefore.value = response.next_before
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function selectTab(tab: Tab): Promise<void> {
  activeTab.value = tab
  if (tab === 'integrations' && webhookReceipts.value.length === 0) {
    await loadIntegrations()
  }
  if (tab === 'organizations' && organizations.value.length === 0) {
    await loadOrganizations()
  }
  if (tab === 'audit' && auditEvents.value.length === 0) {
    await loadAudit()
  }
}

onMounted(loadWorkspace)
</script>

<template>
  <main class="operations-page">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">MoneyBee operations</p>
        <h1>Control the lending operation without losing the audit trail.</h1>
        <p class="hero-copy">
          One responsive portal for queues, customer and lender lookup, tenant access,
          integration health, and provider webhook recovery.
        </p>
      </div>
      <div class="hero-actions">
        <span class="scope-badge">{{ globalScope ? 'Controlled global scope' : 'Organization scope' }}</span>
        <button class="secondary-button" type="button" :disabled="loading" @click="loadWorkspace">
          Refresh
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</p>

    <section v-if="loading" class="panel loading-panel">Loading MoneyBee operations…</section>

    <template v-else-if="workspace">
      <section class="metric-grid" aria-label="Operations metrics">
        <article class="metric-card">
          <span>Leads</span>
          <strong>{{ metric('lead_count') }}</strong>
        </article>
        <article class="metric-card">
          <span>Applications</span>
          <strong>{{ metric('application_count') }}</strong>
        </article>
        <article class="metric-card">
          <span>Lender submissions</span>
          <strong>{{ metric('lender_submission_count') }}</strong>
        </article>
        <article class="metric-card">
          <span>Open work items</span>
          <strong>{{ metric('open_task_count') }}</strong>
        </article>
      </section>

      <nav class="tab-bar" aria-label="Operations portal sections">
        <button :class="{ active: activeTab === 'queue' }" type="button" @click="selectTab('queue')">Work queue</button>
        <button :class="{ active: activeTab === 'search' }" type="button" @click="selectTab('search')">Global search</button>
        <button :class="{ active: activeTab === 'integrations' }" type="button" @click="selectTab('integrations')">Integrations</button>
        <button :class="{ active: activeTab === 'organizations' }" type="button" @click="selectTab('organizations')">Organizations</button>
        <button :class="{ active: activeTab === 'audit' }" type="button" @click="selectTab('audit')">Audit</button>
      </nav>

      <section v-if="activeTab === 'queue'" class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Daily operations</p>
            <h2>Work queue</h2>
          </div>
          <form class="filter-row" @submit.prevent="loadWorkQueue">
            <select v-model="queueStatus" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select v-model="queuePriority" aria-label="Filter by priority">
              <option value="">All priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
            <button class="primary-button" type="submit" :disabled="actionPending">Apply</button>
          </form>
        </div>

        <div v-if="workQueue.length" class="queue-table" role="table" aria-label="MoneyBee work queue">
          <div class="queue-row queue-header" role="row">
            <span>Work item</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due</span>
            <span>Action</span>
          </div>
          <div v-for="task in workQueue" :key="task.id" class="queue-row" role="row">
            <div>
              <strong>{{ task.title }}</strong>
              <small>{{ task.task_type }} · {{ task.application_id || 'No application' }}</small>
            </div>
            <span class="priority-pill" :data-priority="task.priority">{{ task.priority }}</span>
            <select
              :value="task.status"
              aria-label="Update task status"
              :disabled="actionPending"
              @change="updateTask(task, { status: ($event.target as HTMLSelectElement).value })"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <span>{{ formatDate(task.due_at) }}</span>
            <button
              class="text-button"
              type="button"
              :disabled="actionPending || task.status === 'COMPLETED'"
              @click="updateTask(task, { status: 'COMPLETED' })"
            >
              Complete
            </button>
          </div>
        </div>
        <p v-else class="empty-copy">No work items match the selected filters.</p>
      </section>

      <section v-else-if="activeTab === 'search'" class="panel">
        <div class="section-heading search-heading">
          <div>
            <p class="eyebrow">PII-minimized lookup</p>
            <h2>Global search</h2>
          </div>
          <form class="search-form" @submit.prevent="runSearch">
            <input v-model="searchQuery" minlength="2" maxlength="120" placeholder="Application, business, lender…" />
            <button class="primary-button" type="submit" :disabled="searching">Search</button>
          </form>
        </div>
        <div v-if="searchResults.length" class="search-grid">
          <article v-for="result in searchResults" :key="`${result.type}-${result.id}`" class="search-card">
            <span>{{ result.type }}</span>
            <strong>{{ result.label }}</strong>
            <small>{{ result.status || 'No status' }} · {{ result.id }}</small>
          </article>
        </div>
        <p v-else class="empty-copy">Search results return only allowlisted operational fields.</p>
      </section>

      <section v-else-if="activeTab === 'integrations'" class="content-grid integrations-grid">
        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Control plane</p>
              <h2>Inbox and outbox</h2>
            </div>
            <button class="text-button" type="button" :disabled="actionPending" @click="loadIntegrations">Refresh</button>
          </div>
          <pre class="health-panel">{{ JSON.stringify(integrationHealth, null, 2) }}</pre>
        </article>

        <article class="panel">
          <div class="section-heading integrations-heading">
            <div>
              <p class="eyebrow">Authenticated intake</p>
              <h2>Webhook receipts</h2>
            </div>
            <form class="filter-row" @submit.prevent="loadIntegrations">
              <input v-model="webhookProvider" placeholder="Provider" />
              <select v-model="webhookStatus">
                <option value="">All statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="PROCESSING">Processing</option>
                <option value="RETRY">Retry</option>
                <option value="PROCESSED">Processed</option>
                <option value="DEAD_LETTER">Dead letter</option>
              </select>
              <button class="primary-button" type="submit" :disabled="actionPending">Filter</button>
            </form>
          </div>
          <div v-if="webhookReceipts.length" class="receipt-list">
            <article v-for="receipt in webhookReceipts" :key="receipt.id" class="receipt-card">
              <div>
                <span>{{ receipt.provider }} · {{ receipt.event_type }}</span>
                <strong>{{ receipt.status }}</strong>
                <small>
                  {{ receipt.provider_event_id }} · Attempt {{ receipt.attempts }} ·
                  {{ formatDate(receipt.created_at) }}
                </small>
              </div>
              <button
                v-if="['FAILED', 'RETRY', 'DEAD_LETTER'].includes(receipt.status)"
                class="text-button"
                type="button"
                :disabled="actionPending"
                @click="requeueReceipt(receipt)"
              >
                Requeue
              </button>
            </article>
          </div>
          <p v-else class="empty-copy">No webhook receipts match the selected filters.</p>
        </article>
      </section>

      <section v-else-if="activeTab === 'organizations'" class="content-grid organizations-grid">
        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Tenant directory</p>
              <h2>Organizations</h2>
            </div>
            <form class="filter-row" @submit.prevent="loadOrganizations">
              <select v-model="organizationType">
                <option value="">All types</option>
                <option value="BORROWER">Borrower</option>
                <option value="LENDER">Lender</option>
                <option value="MONEYBEE">MoneyBee</option>
                <option value="AFFILIATE">Affiliate</option>
              </select>
              <button class="primary-button" type="submit" :disabled="actionPending">Apply</button>
            </form>
          </div>
          <div v-if="organizations.length" class="organization-list">
            <button
              v-for="organization in organizations"
              :key="organization.id"
              type="button"
              :class="{ selected: selectedOrganizationId === organization.id }"
              @click="loadOrganizationMembers(organization.id)"
            >
              <span>{{ organization.organization_type }}</span>
              <strong>{{ organization.name }}</strong>
              <small>{{ organization.active ? 'Active' : 'Inactive' }}</small>
            </button>
          </div>
          <p v-else class="empty-copy">No organizations match the selected type.</p>
        </article>

        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Authoritative membership</p>
              <h2>Members</h2>
            </div>
          </div>
          <div v-if="organizationMembers.length" class="member-list">
            <article v-for="(entry, index) in organizationMembers" :key="index">
              <strong>{{ value(entry.user as Record<string, unknown>, 'display_name', 'MoneyBee user') }}</strong>
              <span>{{ value(entry.membership as Record<string, unknown>, 'membership_type') }}</span>
              <small>{{ value(entry.membership as Record<string, unknown>, 'active') === 'true' ? 'Active' : 'Inactive' }}</small>
            </article>
          </div>
          <p v-else class="empty-copy">Select an organization to inspect its active memberships.</p>
        </article>
      </section>

      <section v-else class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Evidence</p>
            <h2>Audit events</h2>
          </div>
          <button class="text-button" type="button" :disabled="actionPending" @click="loadAudit(true)">Refresh</button>
        </div>
        <div v-if="auditEvents.length" class="audit-list">
          <article v-for="(event, index) in auditEvents" :key="value(event, 'id', String(index))">
            <div>
              <span>{{ value(event, 'resource_type', value(event, 'event_type', 'Event')) }}</span>
              <strong>{{ value(event, 'action', value(event, 'event_type')) }}</strong>
              <small>{{ value(event, 'resource_id') }} · {{ value(event, 'correlation_id', 'No correlation ID') }}</small>
            </div>
            <time>{{ formatDate(event.created_at || event.occurred_at) }}</time>
          </article>
          <button
            v-if="auditNextBefore"
            class="secondary-button load-more"
            type="button"
            :disabled="actionPending"
            @click="loadAudit(false)"
          >
            Load more evidence
          </button>
        </div>
        <p v-else class="empty-copy">No audit events are available for this scope.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.operations-page {
  width: min(1420px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 76px;
}

.hero-panel,
.panel,
.metric-card,
.tab-bar {
  border: 1px solid rgba(21, 39, 69, 0.1);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 26px 80px rgba(22, 42, 76, 0.08);
}

.hero-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 36px;
  padding: clamp(32px, 6vw, 72px);
  border-radius: 36px;
  background:
    radial-gradient(circle at 92% 8%, rgba(255, 174, 103, 0.3), transparent 34%),
    linear-gradient(145deg, #fff, #fff7f1);
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  max-width: 930px;
  margin-bottom: 18px;
  color: #142440;
  font-size: clamp(2.6rem, 6vw, 5.8rem);
  line-height: 0.97;
  letter-spacing: -0.058em;
}

h2 {
  margin-bottom: 0;
  color: #142440;
  font-size: clamp(1.35rem, 2.7vw, 2.05rem);
  letter-spacing: -0.032em;
}

.eyebrow {
  margin-bottom: 10px;
  color: #c55b18;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy,
.empty-copy {
  color: #647187;
  line-height: 1.65;
}

.hero-copy {
  max-width: 760px;
  margin-bottom: 0;
  font-size: 1.08rem;
}

.hero-actions {
  display: grid;
  justify-items: end;
  gap: 12px;
}

.scope-badge,
.priority-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-weight: 800;
}

.scope-badge {
  padding: 9px 13px;
  background: #fff0e5;
  color: #a54812;
  font-size: 0.8rem;
}

.alert {
  margin: 20px 0 0;
  padding: 14px 18px;
  border-radius: 16px;
  font-weight: 750;
}

.alert-error {
  background: #fff1f1;
  color: #9c2e2e;
}

.alert-success {
  background: #eefbf4;
  color: #176740;
}

.metric-grid,
.content-grid,
.search-grid {
  display: grid;
  gap: 18px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 22px 0;
}

.metric-card {
  padding: 24px;
  border-radius: 22px;
}

.metric-card span {
  display: block;
  margin-bottom: 9px;
  color: #6c788b;
  font-size: 0.82rem;
  font-weight: 750;
}

.metric-card strong {
  color: #142440;
  font-size: 2.25rem;
}

.tab-bar {
  display: flex;
  gap: 7px;
  margin-bottom: 18px;
  padding: 8px;
  overflow-x: auto;
  border-radius: 18px;
}

.tab-bar button {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #617088;
  font: inherit;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}

.tab-bar button.active {
  background: #142440;
  color: #fff;
}

.panel {
  padding: clamp(22px, 4vw, 38px);
  border-radius: 28px;
}

.loading-panel {
  margin-top: 22px;
  text-align: center;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 24px;
}

.filter-row,
.search-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

select,
input {
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 13px;
  border: 1px solid #dce3ed;
  border-radius: 13px;
  background: #fff;
  color: #142440;
  font: inherit;
}

.primary-button,
.secondary-button,
.text-button {
  border: 0;
  border-radius: 13px;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  padding: 0 17px;
}

.primary-button {
  background: #c65a17;
  color: #fff;
}

.secondary-button {
  background: #142440;
  color: #fff;
}

.text-button {
  padding: 8px 2px;
  background: transparent;
  color: #b74d0e;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.queue-table {
  display: grid;
  gap: 8px;
}

.queue-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.6fr) 110px 150px 150px 80px;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f7f9fc;
}

.queue-header {
  background: transparent;
  color: #778398;
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.queue-row strong,
.queue-row small {
  display: block;
}

.queue-row small {
  margin-top: 5px;
  color: #7a879a;
}

.priority-pill {
  width: max-content;
  padding: 7px 10px;
  background: #edf1f7;
  color: #57657a;
  font-size: 0.74rem;
}

.priority-pill[data-priority='URGENT'] {
  background: #ffebeb;
  color: #a52b2b;
}

.priority-pill[data-priority='HIGH'] {
  background: #fff2e8;
  color: #a94a12;
}

.search-heading,
.integrations-heading {
  align-items: flex-end;
}

.search-form input {
  width: min(460px, 52vw);
}

.search-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.search-card {
  display: grid;
  gap: 8px;
  min-height: 120px;
  padding: 18px;
  border-radius: 18px;
  background: #f7f9fc;
}

.search-card span,
.receipt-card span,
.organization-list span {
  color: #c55b18;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-card small,
.receipt-card small,
.organization-list small,
.member-list small,
.audit-list small {
  color: #778398;
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.health-panel {
  min-height: 260px;
  max-height: 520px;
  overflow: auto;
  padding: 18px;
  border-radius: 18px;
  background: #101d32;
  color: #dbe8ff;
  font-size: 0.78rem;
  line-height: 1.6;
}

.receipt-list,
.organization-list,
.member-list,
.audit-list {
  display: grid;
  gap: 10px;
}

.receipt-card,
.member-list article,
.audit-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 15px 16px;
  border-radius: 16px;
  background: #f7f9fc;
}

.receipt-card div,
.audit-list div {
  display: grid;
  gap: 5px;
}

.organization-list button {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: #f7f9fc;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.organization-list button.selected {
  border-color: #d16a27;
  background: #fff6ef;
}

.member-list article {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
}

.audit-list time {
  color: #66758b;
  font-size: 0.82rem;
  white-space: nowrap;
}

.load-more {
  margin-top: 8px;
}

@media (max-width: 1120px) {
  .queue-table {
    overflow-x: auto;
  }

  .queue-row {
    min-width: 900px;
  }

  .search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .metric-grid,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .section-heading,
  .filter-row,
  .search-form {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions {
    justify-items: stretch;
  }

  .search-form input {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .operations-page {
    width: min(100% - 20px, 1420px);
    padding-top: 14px;
  }

  .metric-grid,
  .search-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .panel {
    border-radius: 22px;
  }

  .receipt-card,
  .audit-list article {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
