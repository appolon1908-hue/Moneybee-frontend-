<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  getAuthContext,
  getLenderWorkspace,
  type LenderWorkspace,
} from "@moneybee/api-client";

const workspace = ref<LenderWorkspace | null>(null);
const loading = ref(true);
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    workspace.value = await getLenderWorkspace(context.active_organization_id);
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load lender workspace.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Bank and lender portal</p>
        <h1>Underwrite with a complete operating view.</h1>
        <p>Programs, submissions, bank analysis, tasks, and portfolio positions stay connected to the authoritative MoneyBee record.</p>
      </div>
      <button type="button" :disabled="loading" @click="load">Refresh</button>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading lender operations…</p>

    <template v-else-if="workspace">
      <section class="metrics">
        <article><span>Active programs</span><strong>{{ workspace.summary.active_programs }}</strong></article>
        <article><span>Submissions</span><strong>{{ workspace.summary.submission_count }}</strong></article>
        <article><span>Pending review</span><strong>{{ workspace.summary.pending_submissions }}</strong></article>
        <article><span>Open tasks</span><strong>{{ workspace.open_tasks.length }}</strong></article>
      </section>

      <section class="grid">
        <article class="panel wide">
          <div class="heading">
            <div><p class="eyebrow">Submission queue</p><h2>Recent applications</h2></div>
            <RouterLink to="/submissions">View all</RouterLink>
          </div>
          <div v-if="workspace.recent_submissions.length" class="rows">
            <RouterLink
              v-for="submission in workspace.recent_submissions.slice(0, 12)"
              :key="submission.id"
              :to="`/submissions/${submission.id}`"
              class="row"
            >
              <div><strong>{{ submission.application_id }}</strong><small>{{ submission.program_id || "Program not assigned" }}</small></div>
              <span>{{ submission.status.replaceAll("_", " ") }}</span>
            </RouterLink>
          </div>
          <p v-else class="empty">No submissions are assigned to this lender.</p>
        </article>

        <article class="panel">
          <p class="eyebrow">Decision support</p>
          <h2>Review bank analysis</h2>
          <p>See normalized revenue, balance, NSF, and risk signals for applications assigned to your institution.</p>
          <RouterLink class="cta" to="/bank-analysis">Open analysis queue</RouterLink>
        </article>

        <article class="panel">
          <p class="eyebrow">Portfolio</p>
          <h2>Accepted and funded positions</h2>
          <p>Monitor your institution’s accepted, active, funded, and repaid offer positions.</p>
          <RouterLink class="cta" to="/portfolio">Open portfolio</RouterLink>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1440px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
.hero,.heading,.row { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
.hero { padding:clamp(1.5rem,4vw,3rem); border-radius:2rem; color:white; background:linear-gradient(135deg,#0a2540,#00715d 70%,#54d6bb); box-shadow:0 24px 60px rgb(10 37 64 / 18%); }
h1,h2,p { margin-top:0; }
h1 { max-width:850px; margin-bottom:.75rem; font-size:clamp(2.2rem,5.5vw,5rem); line-height:.95; letter-spacing:-.055em; }
h2 { margin-bottom:.5rem; }
.eyebrow { margin-bottom:.4rem; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
.metrics article,.panel { border:1px solid rgb(10 37 64 / 10%); border-radius:1.35rem; padding:1.25rem; background:white; box-shadow:0 12px 36px rgb(10 37 64 / 7%); }
.metrics article { display:grid; gap:.4rem; }
.metrics strong { font-size:2rem; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.wide { grid-column:1/-1; }
.rows { display:grid; }
.row { padding:.9rem 0; border-top:1px solid #e3ece9; color:inherit; text-decoration:none; }
.row:first-child { border-top:0; }
.row div { display:grid; gap:.25rem; }
.row span { border-radius:999px; padding:.3rem .65rem; color:#006454; background:#e7f7f3; font-size:.72rem; font-weight:850; }
small,.empty { color:#61708a; }
a { color:#006454; font-weight:800; text-decoration:none; }
.cta,button { display:inline-flex; align-items:center; min-height:44px; border:0; border-radius:999px; padding:.7rem 1rem; color:white; background:#006454; font:inherit; font-weight:850; cursor:pointer; }
.hero button { color:#0a2540; background:white; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#e7f7f3; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:850px) { .metrics,.grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:620px) { .hero,.heading { flex-direction:column; } .metrics,.grid { grid-template-columns:1fr; } }
</style>
