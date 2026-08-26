<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  getAuthContext,
  listBankAnalysisQueue,
  type BankAnalysisQueueItem,
} from "@moneybee/api-client";

const organizationId = ref("");
const items = ref<BankAnalysisQueueItem[]>([]);
const status = ref("");
const loading = ref(true);
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    items.value = await listBankAnalysisQueue(
      status.value || undefined,
      organizationId.value,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load bank analysis.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header>
      <div><p class="eyebrow">Bank analysis queue</p><h1>Financial signals tied to lender submissions.</h1><p>Only analyses connected to applications assigned to your lender organization are returned.</p></div>
      <label>Status<select v-model="status" @change="load"><option value="">All</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option></select></label>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading analysis queue…</p>
    <section v-else class="queue">
      <article v-for="item in items" :key="String(item.analysis.id)">
        <div class="heading"><div><p class="eyebrow">Submission</p><h2>{{ item.submission.id }}</h2></div><span>{{ item.analysis.status ?? "PENDING" }}</span></div>
        <dl>
          <dt>Average monthly revenue</dt><dd>{{ item.analysis.average_monthly_revenue ?? "—" }}</dd>
          <dt>Average daily balance</dt><dd>{{ item.analysis.average_daily_balance ?? "—" }}</dd>
          <dt>Negative days</dt><dd>{{ item.analysis.negative_days ?? "—" }}</dd>
          <dt>NSF count</dt><dd>{{ item.analysis.nsf_count ?? "—" }}</dd>
        </dl>
        <RouterLink :to="`/submissions/${item.submission.id}`">Open submission workspace →</RouterLink>
      </article>
      <p v-if="!items.length" class="empty">No bank analyses match this queue.</p>
    </section>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1200px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header,.heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
header > div { max-width:850px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#006454; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
header label { display:grid; gap:.4rem; font-weight:750; }
select { min-height:44px; border:1px solid #cbd8d5; border-radius:.75rem; padding:.65rem .75rem; font:inherit; }
.queue { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.queue article { border:1px solid #dce7e4; border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(10 37 64 / 7%); }
.heading span { border-radius:999px; padding:.3rem .65rem; color:#006454; background:#e7f7f3; font-size:.72rem; font-weight:850; }
dl { display:grid; grid-template-columns:1fr auto; gap:.55rem 1rem; }
dt { color:#64748b; } dd { margin:0; font-weight:750; }
a { color:#006454; font-weight:800; text-decoration:none; }
.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#e7f7f3; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:760px) { header { flex-direction:column; } .queue { grid-template-columns:1fr; } }
</style>
