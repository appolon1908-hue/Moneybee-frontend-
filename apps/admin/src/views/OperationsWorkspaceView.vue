<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  getAdminOperationsWorkspace,
  getAuthContext,
  type AdminOperationsWorkspace,
} from "@moneybee/api-client";

const workspace = ref<AdminOperationsWorkspace | null>(null);
const loading = ref(true);
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    workspace.value = await getAdminOperationsWorkspace(
      context.active_organization_id,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load operations.";
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
        <p class="eyebrow">MoneyBee operations</p>
        <h1>One command center for the lending workflow.</h1>
        <p>Applications, lender submissions, work queues, exceptions, and provider receipts stay visible without bypassing domain authorization.</p>
      </div>
      <button type="button" :disabled="loading" @click="load">Refresh</button>
    </header>

    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading operations workspace…</p>

    <template v-else-if="workspace">
      <section class="metrics">
        <article><span>Active applications</span><strong>{{ workspace.metrics.active_applications }}</strong><small>{{ workspace.metrics.applications }} total</small></article>
        <article><span>Pending lender submissions</span><strong>{{ workspace.metrics.pending_lender_submissions }}</strong><small>{{ workspace.metrics.lender_submissions }} total</small></article>
        <article><span>Open work</span><strong>{{ workspace.metrics.open_tasks }}</strong><small>{{ workspace.metrics.urgent_tasks }} urgent</small></article>
        <article><span>Operational exceptions</span><strong>{{ workspace.metrics.open_operational_exceptions }}</strong><small>Open, retry, or blocked</small></article>
      </section>

      <section class="quick-links">
        <RouterLink to="/work-queue"><strong>Work queue</strong><span>Assign and transition tenant-scoped tasks →</span></RouterLink>
        <RouterLink to="/search"><strong>Global search</strong><span>Find leads, users, and organizations →</span></RouterLink>
        <RouterLink to="/organizations"><strong>Organizations</strong><span>Review memberships and local identity →</span></RouterLink>
        <RouterLink to="/webhooks"><strong>Webhook operations</strong><span>Inspect signed durable provider events →</span></RouterLink>
      </section>

      <section class="columns">
        <article class="panel">
          <div class="heading"><div><p class="eyebrow">Priority queue</p><h2>Open operational work</h2></div><RouterLink to="/work-queue">Full queue</RouterLink></div>
          <div v-if="workspace.work_queue.length" class="rows">
            <div v-for="task in workspace.work_queue.slice(0, 12)" :key="task.id">
              <div><strong>{{ task.title }}</strong><small>{{ task.assigned_to_subject || "Unassigned" }} · v{{ task.version }}</small></div>
              <span :class="task.priority.toLowerCase()">{{ task.priority }}</span>
            </div>
          </div>
          <p v-else class="empty">No open portal work is waiting.</p>
        </article>

        <article class="panel">
          <div class="heading"><div><p class="eyebrow">Exceptions</p><h2>Items needing intervention</h2></div><RouterLink to="/exceptions">All exceptions</RouterLink></div>
          <div v-if="workspace.operational_exceptions.length" class="rows">
            <div v-for="exception in workspace.operational_exceptions" :key="String(exception.id)">
              <div><strong>{{ exception.exception_type ?? exception.entity_type ?? "Operational exception" }}</strong><small>{{ exception.message ?? exception.last_error ?? "Review required" }}</small></div>
              <span>{{ exception.status ?? "OPEN" }}</span>
            </div>
          </div>
          <p v-else class="empty">No open operational exceptions are recorded.</p>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1500px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
.hero,.heading,.rows > div { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
.hero { padding:clamp(1.5rem,4vw,3rem); border-radius:2rem; color:white; background:linear-gradient(135deg,#17133f,#5b2fc4 65%,#f044a5); box-shadow:0 24px 60px rgb(23 19 63 / 20%); }
h1,h2,p { margin-top:0; }
h1 { max-width:900px; margin-bottom:.75rem; font-size:clamp(2.2rem,5.5vw,5.2rem); line-height:.94; letter-spacing:-.06em; }
.eyebrow { margin-bottom:.4rem; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.metrics,.quick-links { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
.metrics article,.quick-links a,.panel { border:1px solid rgb(23 19 63 / 10%); border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(23 19 63 / 7%); }
.metrics article { display:grid; gap:.3rem; }
.metrics strong { font-size:2rem; }
.quick-links a { display:grid; gap:.45rem; color:inherit; text-decoration:none; transition:transform 160ms ease; }
.quick-links a:hover { transform:translateY(-3px); }
.quick-links span,small,.empty { color:#657087; }
.columns { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.rows { display:grid; }
.rows > div { padding:.85rem 0; border-top:1px solid #e8e5f2; }
.rows > div:first-child { border-top:0; }
.rows div div { display:grid; gap:.25rem; }
.rows span { width:fit-content; border-radius:999px; padding:.3rem .6rem; color:#5b2fc4; background:#f0ebff; font-size:.72rem; font-weight:850; }
.rows span.urgent,.rows span.high { color:#9b1d67; background:#ffeaf6; }
a { color:#5b2fc4; font-weight:800; text-decoration:none; }
button { min-height:44px; border:0; border-radius:999px; padding:.7rem 1rem; color:#17133f; background:white; font:inherit; font-weight:850; cursor:pointer; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#f0ebff; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:1000px) { .metrics,.quick-links { grid-template-columns:repeat(2,minmax(0,1fr)); } .columns { grid-template-columns:1fr; } }
@media (max-width:620px) { .hero,.heading { flex-direction:column; } .metrics,.quick-links { grid-template-columns:1fr; } }
</style>
