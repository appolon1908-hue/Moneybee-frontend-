<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  lenderPortalApi,
  portalApi,
  type LenderDecisionInput,
  type LenderWorkspace,
  type PortalContext,
} from '@moneybee/api-client'

const loading = ref(true)
const actionPending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const context = ref<PortalContext | null>(null)
const workspace = ref<LenderWorkspace | null>(null)
const bankQueue = ref<Array<Record<string, unknown>>>([])
const portfolio = ref<Record<string, unknown>>({})
const selectedSubmissionId = ref('')
const submissionWorkspace = ref<Record<string, unknown> | null>(null)
const decision = ref<LenderDecisionInput['decision']>('REQUEST_INFORMATION')
const decisionReason = ref('')
const decisionComments = ref('')
const approvedAmount = ref('')
const interestRate = ref('')
const termMonths = ref('')

const organizationId = computed(() => context.value?.active_organization_id ?? null)
const programs = computed(() => workspace.value?.programs ?? [])
const submissions = computed(() => workspace.value?.submissions ?? [])
const offers = computed(() => workspace.value?.offers ?? [])

function text(record: Record<string, unknown>, key: string, fallback = '—'): string {
  const value = record[key]
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function numeric(record: Record<string, unknown>, key: string): number {
  const value = Number(record[key])
  return Number.isFinite(value) ? value : 0
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

function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The lender workspace could not complete that request.'
}

function clearMessages(): void {
  errorMessage.value = ''
  successMessage.value = ''
}

async function loadWorkspace(): Promise<void> {
  loading.value = true
  clearMessages()
  try {
    const nextContext = await portalApi.context()
    context.value = nextContext
    const [nextWorkspace, nextQueue, nextPortfolio] = await Promise.all([
      lenderPortalApi.workspace(nextContext.active_organization_id),
      lenderPortalApi.bankAnalysisQueue(nextContext.active_organization_id),
      lenderPortalApi.portfolio(nextContext.active_organization_id),
    ])
    workspace.value = nextWorkspace
    bankQueue.value = nextQueue.items
    portfolio.value = nextPortfolio
    if (
      !selectedSubmissionId.value ||
      !nextWorkspace.submissions.some(
        (item) => text(item, 'id') === selectedSubmissionId.value,
      )
    ) {
      selectedSubmissionId.value = text(nextWorkspace.submissions[0] ?? {}, 'id', '')
    }
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    loading.value = false
  }
}

async function loadSubmissionWorkspace(): Promise<void> {
  submissionWorkspace.value = null
  if (!selectedSubmissionId.value || !organizationId.value) return
  try {
    submissionWorkspace.value = await lenderPortalApi.submissionWorkspace(
      selectedSubmissionId.value,
      organizationId.value,
    )
  } catch (error) {
    errorMessage.value = describeError(error)
  }
}

async function toggleProgram(program: Record<string, unknown>): Promise<void> {
  if (!organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    await lenderPortalApi.patchProgram(
      text(program, 'id'),
      { active: !Boolean(program.active) },
      numeric(program, 'version') || 1,
      organizationId.value,
    )
    successMessage.value = 'Program status updated.'
    await loadWorkspace()
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

async function submitDecision(): Promise<void> {
  if (!selectedSubmissionId.value || !organizationId.value) return
  actionPending.value = true
  clearMessages()
  try {
    const payload: LenderDecisionInput = {
      decision: decision.value,
      reason_code: decisionReason.value.trim() || undefined,
      comments: decisionComments.value.trim() || undefined,
      conditions: [],
    }
    if (decision.value === 'APPROVE') {
      if (approvedAmount.value) payload.approved_amount = approvedAmount.value
      if (interestRate.value) payload.interest_rate = interestRate.value
      if (termMonths.value) payload.term_months = Number(termMonths.value)
    }
    const result = await lenderPortalApi.recordDecision(
      selectedSubmissionId.value,
      payload,
      crypto.randomUUID(),
      organizationId.value,
    )
    successMessage.value = result.replayed
      ? 'The existing decision was returned safely.'
      : 'Decision recorded and sent to MoneyBee operations for review.'
    decisionComments.value = ''
    await Promise.all([loadWorkspace(), loadSubmissionWorkspace()])
  } catch (error) {
    errorMessage.value = describeError(error)
  } finally {
    actionPending.value = false
  }
}

watch(selectedSubmissionId, loadSubmissionWorkspace)

onMounted(async () => {
  await loadWorkspace()
  await loadSubmissionWorkspace()
})
</script>

<template>
  <main class="portal-page">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">MoneyBee lender portal</p>
        <h1>Make lending decisions with the full picture.</h1>
        <p class="hero-copy">
          Programs, submissions, bank analysis, offers, and decision review in one
          tenant-isolated workspace.
        </p>
      </div>
      <button class="secondary-button" type="button" :disabled="loading" @click="loadWorkspace">
        Refresh portfolio
      </button>
    </section>

    <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</p>

    <section v-if="loading" class="panel loading-panel">Loading lender workspace…</section>

    <template v-else-if="workspace">
      <section class="metric-grid" aria-label="Lender portfolio metrics">
        <article class="metric-card">
          <span>Programs</span>
          <strong>{{ workspace.summary.program_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Pending submissions</span>
          <strong>{{ workspace.summary.pending_submission_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Total submissions</span>
          <strong>{{ workspace.summary.submission_count }}</strong>
        </article>
        <article class="metric-card">
          <span>Offers</span>
          <strong>{{ workspace.summary.offer_count }}</strong>
        </article>
      </section>

      <section class="content-grid top-grid">
        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Credit programs</p>
              <h2>Program controls</h2>
            </div>
            <span class="count-badge">{{ programs.length }}</span>
          </div>
          <div v-if="programs.length" class="item-list">
            <div v-for="program in programs" :key="text(program, 'id')" class="list-item">
              <div>
                <strong>{{ text(program, 'name', 'Lending program') }}</strong>
                <p>
                  {{ formatMoney(program.min_amount) }} – {{ formatMoney(program.max_amount) }}
                  · {{ text(program, 'min_term_months') }}–{{ text(program, 'max_term_months') }} months
                </p>
                <small>Version {{ text(program, 'version', '1') }}</small>
              </div>
              <button
                type="button"
                class="status-button"
                :class="{ active: Boolean(program.active) }"
                :disabled="actionPending"
                @click="toggleProgram(program)"
              >
                {{ program.active ? 'Active' : 'Paused' }}
              </button>
            </div>
          </div>
          <p v-else class="empty-copy">No programs are assigned to this lender.</p>
        </article>

        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Bank intelligence</p>
              <h2>Analysis queue</h2>
            </div>
            <span class="count-badge">{{ bankQueue.length }}</span>
          </div>
          <div v-if="bankQueue.length" class="item-list compact-list">
            <div v-for="analysis in bankQueue.slice(0, 8)" :key="text(analysis, 'id')" class="list-item">
              <div>
                <strong>Application {{ text(analysis, 'application_id') }}</strong>
                <p>
                  Revenue {{ formatMoney(analysis.average_monthly_revenue) }} ·
                  Balance {{ formatMoney(analysis.average_daily_balance) }}
                </p>
                <small>
                  {{ text(analysis, 'status', 'Pending') }} · {{ text(analysis, 'nsf_count', '0') }} NSF events
                </small>
              </div>
            </div>
          </div>
          <p v-else class="empty-copy">No bank analyses are waiting.</p>
        </article>
      </section>

      <section class="panel submission-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Submission review</p>
            <h2>Applications sent to your institution</h2>
          </div>
          <label class="submission-select">
            <span>Selected submission</span>
            <select v-model="selectedSubmissionId">
              <option v-for="submission in submissions" :key="text(submission, 'id')" :value="text(submission, 'id')">
                {{ text(submission, 'status', 'Pending') }} · {{ text(submission, 'application_id') }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="selectedSubmissionId" class="review-grid">
          <div class="review-summary">
            <div>
              <span>Status</span>
              <strong>{{ text((submissionWorkspace?.submission as Record<string, unknown>) || {}, 'status', 'Pending') }}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{{ formatDate((submissionWorkspace?.submission as Record<string, unknown>)?.submitted_at) }}</strong>
            </div>
            <div>
              <span>Offers</span>
              <strong>{{ ((submissionWorkspace?.offers as unknown[]) || []).length }}</strong>
            </div>
            <div>
              <span>Review tasks</span>
              <strong>{{ ((submissionWorkspace?.tasks as unknown[]) || []).length }}</strong>
            </div>
          </div>

          <form class="decision-form" @submit.prevent="submitDecision">
            <div>
              <p class="eyebrow">Controlled decision</p>
              <h3>Record a lender response</h3>
              <p class="form-copy">
                Decisions enter MoneyBee's review queue. This screen does not fund a loan or
                bypass the authoritative workflow.
              </p>
            </div>
            <label>
              <span>Decision</span>
              <select v-model="decision">
                <option value="REQUEST_INFORMATION">Request information</option>
                <option value="APPROVE">Approve for review</option>
                <option value="DECLINE">Decline</option>
              </select>
            </label>
            <div v-if="decision === 'APPROVE'" class="field-row">
              <label>
                <span>Approved amount</span>
                <input v-model="approvedAmount" inputmode="decimal" placeholder="25000" />
              </label>
              <label>
                <span>Interest rate</span>
                <input v-model="interestRate" inputmode="decimal" placeholder="12.5" />
              </label>
              <label>
                <span>Term months</span>
                <input v-model="termMonths" inputmode="numeric" placeholder="24" />
              </label>
            </div>
            <label>
              <span>Reason code</span>
              <input v-model="decisionReason" maxlength="100" />
            </label>
            <label>
              <span>Review notes</span>
              <textarea v-model="decisionComments" rows="5" maxlength="10000" />
            </label>
            <button class="primary-button" type="submit" :disabled="actionPending">
              Record decision
            </button>
          </form>
        </div>
        <p v-else class="empty-copy">No lender submissions are available.</p>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Offer activity</p>
              <h2>Recent offers</h2>
            </div>
            <span class="count-badge">{{ offers.length }}</span>
          </div>
          <div v-if="offers.length" class="item-list">
            <div v-for="offer in offers.slice(0, 8)" :key="text(offer, 'id')" class="list-item">
              <div>
                <strong>{{ formatMoney(offer.approved_amount || offer.amount) }}</strong>
                <p>{{ text(offer, 'term_months') }} months · {{ text(offer, 'interest_rate') }}%</p>
                <small>{{ text(offer, 'status') }} · Expires {{ formatDate(offer.expires_at) }}</small>
              </div>
            </div>
          </div>
          <p v-else class="empty-copy">No offers have been created.</p>
        </article>

        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Portfolio state</p>
              <h2>Status distribution</h2>
            </div>
          </div>
          <div class="portfolio-list">
            <div
              v-for="(count, statusName) in (portfolio.submission_status_counts as Record<string, number>) || {}"
              :key="statusName"
            >
              <span>{{ statusName }}</span>
              <strong>{{ count }}</strong>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.portal-page {
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 72px;
}

.hero-panel,
.panel,
.metric-card {
  border: 1px solid rgba(19, 39, 70, 0.1);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 26px 78px rgba(24, 46, 82, 0.08);
}

.hero-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: clamp(30px, 6vw, 68px);
  border-radius: 34px;
  background:
    radial-gradient(circle at 90% 5%, rgba(91, 225, 190, 0.28), transparent 34%),
    linear-gradient(145deg, #ffffff, #f2fbf8);
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  max-width: 860px;
  margin-bottom: 18px;
  color: #10263c;
  font-size: clamp(2.6rem, 6vw, 5.6rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

h2 {
  margin-bottom: 0;
  color: #10263c;
  font-size: clamp(1.35rem, 2.7vw, 2rem);
  letter-spacing: -0.03em;
}

h3 {
  margin-bottom: 8px;
  color: #10263c;
  font-size: 1.4rem;
}

.eyebrow {
  margin-bottom: 10px;
  color: #168568;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy,
.form-copy,
.empty-copy,
.list-item p {
  color: #617488;
  line-height: 1.65;
}

.hero-copy {
  max-width: 720px;
  margin-bottom: 0;
  font-size: 1.08rem;
}

.alert {
  margin: 20px 0 0;
  padding: 14px 18px;
  border-radius: 16px;
  font-weight: 750;
}

.alert-error {
  background: #fff1f1;
  color: #9c2d2d;
}

.alert-success {
  background: #eefbf5;
  color: #17694c;
}

.metric-grid,
.content-grid,
.review-grid {
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
.review-summary span {
  display: block;
  margin-bottom: 9px;
  color: #6b7d90;
  font-size: 0.82rem;
  font-weight: 750;
}

.metric-card strong {
  color: #10263c;
  font-size: 2.25rem;
}

.panel {
  padding: clamp(22px, 4vw, 38px);
  border-radius: 28px;
}

.loading-panel {
  margin-top: 22px;
  text-align: center;
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.top-grid {
  align-items: start;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.count-badge {
  min-width: 34px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #eaf9f4;
  color: #14765e;
  text-align: center;
  font-weight: 850;
}

.item-list,
.portfolio-list {
  display: grid;
  gap: 12px;
}

.list-item,
.portfolio-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px;
  border-radius: 17px;
  background: #f6f9fb;
}

.list-item p {
  margin: 6px 0;
}

.list-item small {
  color: #7a8999;
}

.status-button,
.primary-button,
.secondary-button {
  border: 0;
  border-radius: 14px;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}

.status-button {
  padding: 9px 13px;
  background: #f0f2f5;
  color: #697789;
}

.status-button.active {
  background: #def7ed;
  color: #126d53;
}

.primary-button,
.secondary-button {
  min-height: 46px;
  padding: 0 18px;
}

.primary-button {
  background: #137b62;
  color: #fff;
}

.secondary-button {
  background: #10263c;
  color: #fff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.submission-panel {
  margin-bottom: 18px;
}

.submission-select,
.decision-form label {
  display: grid;
  gap: 8px;
  color: #526579;
  font-size: 0.84rem;
  font-weight: 750;
}

select,
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d9e3e7;
  border-radius: 14px;
  background: #fff;
  color: #10263c;
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

.review-grid {
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  align-items: start;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.review-summary > div {
  min-height: 90px;
  padding: 18px;
  border-radius: 18px;
  background: #f6f9fb;
}

.review-summary strong {
  color: #10263c;
}

.decision-form {
  display: grid;
  gap: 14px;
  padding: 24px;
  border-radius: 22px;
  background: #f3faf7;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.portfolio-list span {
  color: #617488;
  text-transform: capitalize;
}

.portfolio-list strong {
  color: #10263c;
  font-size: 1.25rem;
}

@media (max-width: 980px) {
  .metric-grid,
  .content-grid,
  .review-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .review-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 660px) {
  .portal-page {
    width: min(100% - 20px, 1320px);
    padding-top: 14px;
  }

  .metric-grid,
  .content-grid,
  .review-summary,
  .field-row {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .panel {
    border-radius: 22px;
  }

  .list-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
