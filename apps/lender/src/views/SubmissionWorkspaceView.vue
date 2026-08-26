<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  getAuthContext,
  getLenderSubmissionWorkspace,
  recordLenderDecision,
  type LenderDecisionCreate,
  type LenderSubmissionWorkspace,
} from "@moneybee/api-client";

const route = useRoute();
const submissionId = computed(() => String(route.params.id ?? ""));
const organizationId = ref("");
const workspace = ref<LenderSubmissionWorkspace | null>(null);
const decision = ref<LenderDecisionCreate["decision"]>("REQUEST_INFORMATION");
const notes = ref("");
const requestedItems = ref("");
const offerAmount = ref("");
const termMonths = ref("");
const interestRate = ref("");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    workspace.value = await getLenderSubmissionWorkspace(
      submissionId.value,
      organizationId.value,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load submission.";
  } finally {
    loading.value = false;
  }
}

async function submitDecision(): Promise<void> {
  saving.value = true;
  error.value = "";
  success.value = "";
  const payload: LenderDecisionCreate = {
    decision: decision.value,
    notes: notes.value.trim() || null,
    requested_items:
      decision.value === "REQUEST_INFORMATION"
        ? requestedItems.value.split("\n").map((item) => item.trim()).filter(Boolean)
        : [],
    offer_amount:
      decision.value === "APPROVE" && offerAmount.value ? offerAmount.value : null,
    term_months:
      decision.value === "APPROVE" && termMonths.value
        ? Number(termMonths.value)
        : null,
    interest_rate:
      decision.value === "APPROVE" && interestRate.value ? interestRate.value : null,
  };
  try {
    const result = await recordLenderDecision(
      submissionId.value,
      payload,
      crypto.randomUUID(),
      organizationId.value,
    );
    success.value = `Decision recorded as ${result.status}. No live lender submission was triggered.`;
    await load();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "The lender decision could not be recorded.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">Submission workspace</p>
      <h1>Review evidence. Record a controlled decision.</h1>
      <p>Decisions require a unique idempotency key and update only the authoritative MoneyBee submission record.</p>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="success" class="notice success" role="status">{{ success }}</p>
    <p v-if="loading" class="notice">Loading submission workspace…</p>

    <template v-else-if="workspace">
      <section class="summary">
        <article><span>Status</span><strong>{{ String(workspace.submission.status).replaceAll('_', ' ') }}</strong></article>
        <article><span>Requested</span><strong>{{ workspace.application.requested_amount ?? "Pending" }}</strong></article>
        <article><span>Conditions</span><strong>{{ workspace.conditions.length }}</strong></article>
        <article><span>Bank analyses</span><strong>{{ workspace.bank_analyses.length }}</strong></article>
      </section>

      <section class="layout">
        <div class="evidence">
          <article class="panel">
            <p class="eyebrow">Application</p>
            <h2>Request overview</h2>
            <dl>
              <template v-for="(value, key) in workspace.application" :key="key">
                <dt>{{ String(key).replaceAll('_', ' ') }}</dt><dd>{{ value ?? "—" }}</dd>
              </template>
            </dl>
          </article>

          <article class="panel">
            <p class="eyebrow">Bank analysis</p>
            <h2>Normalized financial signals</h2>
            <div v-if="workspace.bank_analyses.length" class="cards">
              <div v-for="analysis in workspace.bank_analyses" :key="String(analysis.id)">
                <strong>{{ analysis.analysis_type ?? "Bank analysis" }}</strong>
                <span>{{ analysis.status ?? "PENDING" }}</span>
                <small>Average revenue: {{ analysis.average_monthly_revenue ?? "—" }}</small>
                <small>NSF count: {{ analysis.nsf_count ?? "—" }}</small>
                <small>Negative days: {{ analysis.negative_days ?? "—" }}</small>
              </div>
            </div>
            <p v-else class="empty">No bank analysis is available for this submission.</p>
          </article>

          <article class="panel">
            <p class="eyebrow">Conditions</p>
            <h2>Outstanding requirements</h2>
            <div v-if="workspace.conditions.length" class="rows">
              <div v-for="condition in workspace.conditions" :key="String(condition.id)">
                <div><strong>{{ condition.title ?? condition.condition_type }}</strong><small>{{ condition.description }}</small></div>
                <span>{{ condition.status }}</span>
              </div>
            </div>
            <p v-else class="empty">No underwriting conditions are recorded.</p>
          </article>
        </div>

        <form class="decision" @submit.prevent="submitDecision">
          <p class="eyebrow">Controlled command</p>
          <h2>Record lender decision</h2>
          <label>Decision
            <select v-model="decision">
              <option value="REQUEST_INFORMATION">Request information</option>
              <option value="APPROVE">Approve</option>
              <option value="DECLINE">Decline</option>
            </select>
          </label>
          <label>Notes<textarea v-model="notes" rows="5" maxlength="10000" /></label>
          <label v-if="decision === 'REQUEST_INFORMATION'">Requested items
            <textarea v-model="requestedItems" rows="6" placeholder="One item per line" />
          </label>
          <template v-if="decision === 'APPROVE'">
            <label>Offer amount<input v-model="offerAmount" type="number" min="0.01" step="0.01" /></label>
            <label>Term months<input v-model="termMonths" type="number" min="1" max="120" /></label>
            <label>Interest rate (%)<input v-model="interestRate" type="number" min="0" max="100" step="0.01" /></label>
          </template>
          <button type="submit" :disabled="saving">{{ saving ? "Recording…" : "Record decision" }}</button>
          <small>This action does not call a live lender API or initiate funding.</small>
        </form>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1440px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header { max-width:960px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#006454; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
.summary article,.panel,.decision { border:1px solid #dce7e4; border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(10 37 64 / 7%); }
.summary article { display:grid; gap:.35rem; }
.summary strong { font-size:1.5rem; }
.layout { display:grid; grid-template-columns:minmax(0,2fr) minmax(300px,.8fr); gap:1rem; align-items:start; }
.evidence { display:grid; gap:1rem; }
dl { display:grid; grid-template-columns:minmax(140px,.6fr) 1fr; gap:.55rem 1rem; margin:0; }
dt { color:#64748b; text-transform:capitalize; }
dd { margin:0; overflow-wrap:anywhere; }
.cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
.cards > div { display:grid; gap:.3rem; border-radius:1rem; padding:.9rem; background:#f5faf8; }
.cards span,.rows span { width:fit-content; border-radius:999px; padding:.25rem .55rem; color:#006454; background:#e7f7f3; font-size:.72rem; font-weight:850; }
.rows { display:grid; }
.rows > div { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:.85rem 0; border-top:1px solid #e3ece9; }
.rows > div:first-child { border-top:0; }
.rows div div { display:grid; gap:.25rem; }
.decision { position:sticky; top:1rem; display:grid; gap:.85rem; }
label { display:grid; gap:.45rem; font-weight:750; }
input,select,textarea { border:1px solid #cbd8d5; border-radius:.75rem; padding:.7rem .75rem; font:inherit; }
textarea { resize:vertical; }
button { min-height:46px; border:0; border-radius:999px; padding:.7rem 1rem; color:white; background:#006454; font:inherit; font-weight:850; cursor:pointer; }
button:disabled { opacity:.5; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#e7f7f3; }
.notice.error { color:#8d2115; background:#fff0ed; }
.notice.success { color:#146c43; background:#e9f8f0; }
@media (max-width:900px) { .summary,.cards { grid-template-columns:repeat(2,minmax(0,1fr)); } .layout { grid-template-columns:1fr; } .decision { position:static; } }
@media (max-width:560px) { .summary,.cards { grid-template-columns:1fr; } }
</style>
