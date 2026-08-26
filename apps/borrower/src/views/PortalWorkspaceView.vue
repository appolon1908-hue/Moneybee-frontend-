<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  borrowerPortalApi,
  portalApi,
  uploadPortalDocument,
  type BorrowerApplication,
  type BorrowerApplicationSummary,
  type BorrowerWorkspace,
  type PortalContext,
  type PortalConversation,
  type PortalMessage,
  type PortalTask,
} from '@moneybee/api-client'

const loading = ref(true)
const actionPending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const context = ref<PortalContext | null>(null)
const workspace = ref<BorrowerWorkspace | null>(null)
const applicationSummary = ref<BorrowerApplicationSummary | null>(null)
const selectedApplicationId = ref('')
const selectedConversationId = ref('')
const messages = ref<PortalMessage[]>([])
const newConversationSubject = ref('')
const newConversationMessage = ref('')
const replyBody = ref('')
const uploadInput = ref<HTMLInputElement | null>(null)

const organizationId = computed(() => context.value?.active_organization_id ?? null)
const applications = computed(() => workspace.value?.applications ?? [])
const openTasks = computed(() =>
  (workspace.value?.tasks ?? []).filter(
    (task) => !['COMPLETED', 'CANCELLED'].includes(task.status),
  ),
)
const selectedApplication = computed<BorrowerApplication | null>(() =>
  applications.value.find((item) => item.id === selectedApplicationId.value) ?? null,
)
const conversations = computed<PortalConversation[]>(
  () => workspace.value?.conversations ?? [],
)

function clearMessages(): void {
  errorMessage.value = ''
  successMessage.value = ''
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'The MoneyBee portal could not complete that request.'
}

function formatMoney(value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

async function loadWorkspace(): Promise<void> {
  loading.value = true
  clearMessages()
  try {
    const nextContext = await portalApi.context()
    context.value = nextContext
    const nextWorkspace = await borrowerPortalApi.workspace(
      nextContext.active_organization_id,
    )
    workspace.value = nextWorkspace
    if (
      !selectedApplicationId.value ||
      !nextWorkspace.applications.some(
        (item) => item.id === selectedApplicationId.value,
      )
    ) {
      selectedApplicationId.value = nextWorkspace.applications[0]?.id ?? ''
    }
    selectedConversationId.value = nextWorkspace.conversations[0]?.id ?? ''
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    loading.value = false
  }
}

async function loadApplicationSummary(): Promise<void> {
  applicationSummary.value = null
  if (!selectedApplicationId.value || !organizationId.value) return
  try {
    applicationSummary.value = await borrowerPortalApi.applicationSummary(
      selectedApplicationId.value,
      organizationId.value,
    )
  } catch (error) {
    errorMessage.value = describeError(error)
  }
}

async function loadMessages(): Promise<void> {
  messages.value = []
  if (!selectedConversationId.value || !organizationId.value) return
  try {
    messages.value = await portalApi.messages(
      selectedConversationId.value,
      organizationId.value,
    )
  } catch (error) {
    errorMessage.value = describeError(error)
  }
}

async function completeTask(task: PortalTask): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    await portalApi.patchTask(
      task.id,
      { status: 'COMPLETED', version: task.version },
      organizationId.value,
    )
    successMessage.value = 'Task completed.'
    await loadWorkspace()
    await loadApplicationSummary()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function createConversation(): Promise<void> {
  if (!organizationId.value || !newConversationSubject.value.trim()) return
  actionPending.value = true
  clearMessages()
  try {
    const conversation = await portalApi.createConversation(
      {
        subject: newConversationSubject.value.trim(),
        application_id: selectedApplicationId.value || null,
        first_message: newConversationMessage.value.trim() || null,
      },
      organizationId.value,
    )
    newConversationSubject.value = ''
    newConversationMessage.value = ''
    successMessage.value = 'Conversation started.'
    await loadWorkspace()
    selectedConversationId.value = conversation.id
    await loadMessages()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function sendReply(): Promise<void> {
  if (
    !organizationId.value ||
    !selectedConversationId.value ||
    !replyBody.value.trim()
  ) {
    return
  }
  actionPending.value = true
  clearMessages()
  try {
    await portalApi.createMessage(
      selectedConversationId.value,
      { body: replyBody.value.trim() },
      organizationId.value,
    )
    replyBody.value = ''
    await loadMessages()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function uploadSelectedDocument(): Promise<void> {
  const file = uploadInput.value?.files?.[0]
  if (!file || !selectedApplicationId.value || !organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const session = await portalApi.createUploadSession(
      selectedApplicationId.value,
      {
        original_file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        sha256: await sha256(file),
      },
      organizationId.value,
    )
    await uploadPortalDocument(session, file, organizationId.value)
    if (uploadInput.value) uploadInput.value.value = ''
    successMessage.value =
      'Document uploaded to quarantine. MoneyBee will scan it before review.'
    await loadApplicationSummary()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

watch(selectedApplicationId, loadApplicationSummary)
watch(selectedConversationId, loadMessages)

onMounted(async () => {
  await loadWorkspace()
  await Promise.all([loadApplicationSummary(), loadMessages()])
})
</script>

<template>
  <main class="portal-page">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">MoneyBee borrower portal</p>
        <h1>Your financing, organized.</h1>
        <p class="hero-copy">
          Track every application, document, offer, task, and conversation from one
          secure workspace.
        </p>
      </div>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadWorkspace">
        Refresh
      </button>
    </section>

    <p v-if="errorMessage" class="alert alert-error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="alert alert-success" role="status">
      {{ successMessage }}
    </p>

    <section v-if="loading" class="panel loading-panel" aria-live="polite">
      Loading your MoneyBee workspace…
    </section>

    <template v-else-if="workspace">
      <section class="metric-grid" aria-label="Application summary">
        <article class="metric-card">
          <span>Applications</span>
          <strong>{{ workspace.summary.application_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Active</span>
          <strong>{{ workspace.summary.active_application_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Open tasks</span>
          <strong>{{ workspace.summary.open_task_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Unread updates</span>
          <strong>{{ workspace.summary.unread_notification_count }}</strong>
        </article>
      </section>

      <section v-if="applications.length" class="panel application-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Application center</p>
            <h2>{{ selectedApplication?.business_name || 'Your application' }}</h2>
          </div>
          <label class="application-select">
            <span>Application</span>
            <select v-model="selectedApplicationId">
              <option v-for="application in applications" :key="application.id" :value="application.id">
                {{ application.application_number || application.business_name || application.id }}
              </option>
            </select>
          </label>
        </div>

        <div class="application-summary">
          <div>
            <span>Status</span>
            <strong>{{ selectedApplication?.status || 'In progress' }}</strong>
          </div>
          <div>
            <span>Requested</span>
            <strong>{{ formatMoney(selectedApplication?.requested_amount) }}</strong>
          </div>
          <div>
            <span>Offers</span>
            <strong>{{ applicationSummary?.summary.offer_count ?? 0 }}</strong>
          </div>
          <div>
            <span>Documents</span>
            <strong>{{ applicationSummary?.summary.document_count ?? 0 }}</strong>
          </div>
        </div>
      </section>

      <section v-else class="panel empty-panel">
        <p class="eyebrow">Get started</p>
        <h2>No application yet</h2>
        <p>Create an application from the application area to begin your MoneyBee journey.</p>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Next steps</p>
              <h2>Tasks</h2>
            </div>
            <span class="count-badge">{{ openTasks.length }}</span>
          </div>
          <div v-if="openTasks.length" class="item-list">
            <div v-for="task in openTasks" :key="task.id" class="list-item">
              <div>
                <strong>{{ task.title }}</strong>
                <p>{{ task.description || 'Complete this item to keep your application moving.' }}</p>
                <small>{{ task.priority }} · Due {{ formatDate(task.due_at) }}</small>
              </div>
              <button
                type="button"
                class="text-button"
                :disabled="actionPending"
                @click="completeTask(task)"
              >
                Mark done
              </button>
            </div>
          </div>
          <p v-else class="empty-copy">You are caught up. No open tasks.</p>
        </article>

        <article class="panel">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Secure documents</p>
              <h2>Upload center</h2>
            </div>
          </div>
          <p class="body-copy">
            Files are encrypted in transit, checked for integrity, and quarantined before
            MoneyBee reviews them.
          </p>
          <input ref="uploadInput" class="file-input" type="file" />
          <button
            class="primary-button"
            type="button"
            :disabled="actionPending || !selectedApplicationId"
            @click="uploadSelectedDocument"
          >
            Upload securely
          </button>
          <div v-if="applicationSummary?.upload_sessions.length" class="mini-list">
            <div v-for="session in applicationSummary.upload_sessions.slice(0, 4)" :key="session.id">
              <span>{{ session.original_file_name }}</span>
              <strong>{{ session.scan_status || session.status }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="content-grid communication-grid">
        <article class="panel">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Support</p>
              <h2>Conversations</h2>
            </div>
          </div>
          <select v-if="conversations.length" v-model="selectedConversationId" class="wide-select">
            <option v-for="conversation in conversations" :key="conversation.id" :value="conversation.id">
              {{ conversation.subject }}
            </option>
          </select>
          <div class="message-thread" aria-live="polite">
            <div v-for="message in messages" :key="message.id" class="message-bubble">
              <p>{{ message.body }}</p>
              <small>{{ formatDate(message.created_at) }}</small>
            </div>
            <p v-if="!messages.length" class="empty-copy">No messages in this conversation.</p>
          </div>
          <form class="inline-form" @submit.prevent="sendReply">
            <textarea v-model="replyBody" rows="3" placeholder="Write a message" />
            <button class="primary-button" type="submit" :disabled="actionPending || !selectedConversationId">
              Send message
            </button>
          </form>
        </article>

        <article class="panel">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">New request</p>
              <h2>Start a conversation</h2>
            </div>
          </div>
          <form class="stack-form" @submit.prevent="createConversation">
            <label>
              <span>Subject</span>
              <input v-model="newConversationSubject" required maxlength="240" />
            </label>
            <label>
              <span>Message</span>
              <textarea v-model="newConversationMessage" rows="6" maxlength="20000" />
            </label>
            <button class="primary-button" type="submit" :disabled="actionPending">
              Start conversation
            </button>
          </form>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.portal-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 72px;
}

.hero-panel,
.panel,
.metric-card {
  border: 1px solid rgba(28, 43, 69, 0.1);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 70px rgba(22, 40, 73, 0.08);
}

.hero-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: clamp(28px, 6vw, 64px);
  border-radius: 32px;
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 197, 87, 0.34), transparent 35%),
    linear-gradient(145deg, #ffffff, #f4f8ff);
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  max-width: 760px;
  margin-bottom: 16px;
  font-size: clamp(2.5rem, 6vw, 5.4rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
  color: #10213d;
}

h2 {
  margin-bottom: 0;
  font-size: clamp(1.35rem, 2.6vw, 2rem);
  letter-spacing: -0.03em;
  color: #10213d;
}

.eyebrow {
  margin-bottom: 10px;
  color: #456ce8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy,
.body-copy,
.empty-copy,
.list-item p {
  color: #60708c;
  line-height: 1.65;
}

.hero-copy {
  max-width: 660px;
  margin-bottom: 0;
  font-size: 1.1rem;
}

.alert {
  margin: 20px 0 0;
  padding: 14px 18px;
  border-radius: 16px;
  font-weight: 700;
}

.alert-error {
  background: #fff1f1;
  color: #9b2929;
}

.alert-success {
  background: #eefbf3;
  color: #17633a;
}

.metric-grid,
.content-grid {
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

.metric-card span,
.application-summary span {
  display: block;
  margin-bottom: 10px;
  color: #6b7890;
  font-size: 0.84rem;
  font-weight: 700;
}

.metric-card strong {
  color: #10213d;
  font-size: 2.25rem;
}

.panel {
  padding: clamp(22px, 4vw, 38px);
  border-radius: 26px;
}

.loading-panel,
.empty-panel {
  margin-top: 22px;
  text-align: center;
}

.application-panel {
  margin-bottom: 18px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.section-heading.compact {
  align-items: center;
  margin-bottom: 20px;
}

.application-select,
.stack-form label {
  display: grid;
  gap: 8px;
  color: #50607a;
  font-size: 0.84rem;
  font-weight: 750;
}

select,
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dce3ef;
  border-radius: 14px;
  background: #fff;
  color: #10213d;
  font: inherit;
}

select,
input {
  min-height: 46px;
  padding: 0 14px;
}

textarea {
  padding: 13px 14px;
  resize: vertical;
}

.application-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.application-summary > div {
  padding: 18px;
  border-radius: 18px;
  background: #f6f8fc;
}

.application-summary strong {
  color: #10213d;
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.count-badge {
  min-width: 34px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #edf2ff;
  color: #3458cd;
  text-align: center;
  font-weight: 800;
}

.item-list,
.mini-list {
  display: grid;
  gap: 12px;
}

.list-item,
.mini-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px;
  border-radius: 16px;
  background: #f7f9fc;
}

.list-item p {
  margin: 6px 0;
}

.list-item small,
.message-bubble small {
  color: #7b879b;
}

.primary-button,
.secondary-button,
.text-button {
  border: 0;
  border-radius: 14px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.primary-button,
.secondary-button {
  min-height: 46px;
  padding: 0 18px;
}

.primary-button {
  background: #315ce8;
  color: #fff;
}

.secondary-button {
  background: #10213d;
  color: #fff;
}

.text-button {
  padding: 8px 2px;
  background: transparent;
  color: #315ce8;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.file-input {
  margin: 10px 0 14px;
  padding: 10px;
}

.mini-list {
  margin-top: 20px;
}

.mini-list strong {
  color: #315ce8;
  font-size: 0.76rem;
  text-transform: uppercase;
}

.communication-grid {
  align-items: start;
}

.wide-select {
  margin-bottom: 14px;
}

.message-thread {
  display: grid;
  gap: 10px;
  min-height: 180px;
  max-height: 360px;
  overflow: auto;
  padding: 14px;
  border-radius: 18px;
  background: #f6f8fc;
}

.message-bubble {
  max-width: 88%;
  padding: 13px 15px;
  border-radius: 16px 16px 16px 4px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(30, 48, 78, 0.06);
}

.message-bubble p {
  margin-bottom: 7px;
  color: #253654;
  white-space: pre-wrap;
}

.inline-form,
.stack-form {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .metric-grid,
  .application-summary,
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-panel,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .portal-page {
    width: min(100% - 20px, 1240px);
    padding-top: 14px;
  }

  .hero-panel,
  .panel {
    border-radius: 22px;
  }

  .metric-grid,
  .application-summary,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .list-item,
  .mini-list > div {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
