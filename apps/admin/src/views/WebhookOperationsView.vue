<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  getAuthContext,
  getWebhookReceipt,
  listWebhookReceipts,
  requeueWebhookReceipt,
  type WebhookReceipt,
} from "@moneybee/api-client";

const organizationId = ref("");
const receipts = ref<WebhookReceipt[]>([]);
const selected = ref<WebhookReceipt | null>(null);
const provider = ref("");
const status = ref("");
const loading = ref(true);
const savingId = ref("");
const error = ref("");

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    receipts.value = await listWebhookReceipts(
      { provider: provider.value || undefined, status: status.value || undefined, limit: 250 },
      organizationId.value,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load webhook receipts.";
  } finally {
    loading.value = false;
  }
}

async function inspect(receipt: WebhookReceipt, includePayload = false): Promise<void> {
  error.value = "";
  try {
    selected.value = await getWebhookReceipt(
      receipt.id,
      includePayload,
      organizationId.value,
    );
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to inspect webhook receipt.";
  }
}

async function requeue(receipt: WebhookReceipt): Promise<void> {
  savingId.value = receipt.id;
  error.value = "";
  try {
    const result = await requeueWebhookReceipt(
      receipt.id,
      crypto.randomUUID(),
      organizationId.value,
    );
    receipts.value = receipts.value.map((item) =>
      item.id === result.receipt.id ? result.receipt : item,
    );
    selected.value = result.receipt;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to requeue receipt.";
  } finally {
    savingId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header><div><p class="eyebrow">Provider webhooks</p><h1>Signed events, durable receipts, controlled replay.</h1><p>Payloads are hidden by default. Requeue is limited to failed or blocked receipts and produces an audit event.</p></div><div class="filters"><label>Provider<input v-model="provider" placeholder="plaid" /></label><label>Status<select v-model="status"><option value="">All</option><option>RECEIVED</option><option>PROCESSING</option><option>PROCESSED</option><option>FAILED</option><option>DEAD</option><option>BLOCKED</option></select></label><button type="button" @click="load">Apply</button></div></header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading durable receipts…</p>

    <section v-else class="layout">
      <div class="receipts">
        <article v-for="receipt in receipts" :key="receipt.id" :class="{ selected: selected?.id === receipt.id }">
          <button type="button" class="receipt" @click="inspect(receipt)">
            <div><strong>{{ receipt.provider }} · {{ receipt.event_type }}</strong><small>{{ receipt.event_id }}</small><small>{{ new Date(receipt.created_at).toLocaleString() }}</small></div>
            <span>{{ receipt.status }}</span>
          </button>
          <button v-if="['FAILED','DEAD','RETRY','BLOCKED'].includes(receipt.status)" type="button" class="requeue" :disabled="savingId === receipt.id" @click="requeue(receipt)">Requeue</button>
        </article>
        <p v-if="!receipts.length" class="empty">No webhook receipts match these filters.</p>
      </div>

      <aside v-if="selected">
        <div class="heading"><div><p class="eyebrow">Receipt details</p><h2>{{ selected.provider }} / {{ selected.event_type }}</h2></div><span>{{ selected.status }}</span></div>
        <dl>
          <dt>Event ID</dt><dd>{{ selected.event_id }}</dd>
          <dt>Tenant</dt><dd>{{ selected.tenant_id || "Not supplied" }}</dd>
          <dt>Payload hash</dt><dd>{{ selected.payload_hash }}</dd>
          <dt>Signature</dt><dd>{{ selected.signature_valid ? "Valid" : "Invalid" }}</dd>
          <dt>Attempts</dt><dd>{{ selected.attempts }}</dd>
          <dt>Last error</dt><dd>{{ selected.last_error || "—" }}</dd>
        </dl>
        <button v-if="selected.payload === undefined" type="button" class="payload" @click="inspect(selected, true)">Load sensitive payload</button>
        <details v-else open><summary>Payload</summary><pre>{{ JSON.stringify(selected.payload, null, 2) }}</pre></details>
      </aside>
      <aside v-else class="empty-state"><h2>Select a receipt</h2><p>Choose a durable provider event to inspect its non-sensitive metadata.</p></aside>
    </section>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1440px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header,.heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
header > div:first-child { max-width:850px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#5b2fc4; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.filters { display:grid; grid-template-columns:1fr 1fr auto; gap:.6rem; align-items:end; }
label { display:grid; gap:.4rem; font-weight:750; }
input,select,.filters button,.payload { min-height:44px; border:1px solid #d1cbe4; border-radius:.75rem; padding:.65rem .75rem; font:inherit; }
.filters button,.payload { border-color:#5b2fc4; color:white; background:#5b2fc4; font-weight:850; cursor:pointer; }
.layout { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr); gap:1rem; align-items:start; }
.receipts,aside { border:1px solid #e0dcef; border-radius:1.3rem; padding:1rem; background:white; box-shadow:0 12px 36px rgb(23 19 63 / 7%); }
.receipts article { display:grid; grid-template-columns:1fr auto; align-items:center; gap:.5rem; border-top:1px solid #e8e5f2; }
.receipts article:first-child { border-top:0; }
.receipts article.selected { background:#faf8ff; }
.receipt { display:flex; align-items:center; justify-content:space-between; gap:1rem; width:100%; border:0; padding:.9rem .4rem; text-align:left; background:transparent; font:inherit; cursor:pointer; }
.receipt div { display:grid; gap:.2rem; }
.receipt span,.heading span { border-radius:999px; padding:.3rem .6rem; color:#5b2fc4; background:#f0ebff; font-size:.72rem; font-weight:850; }
.requeue { border:1px solid #9b1d67; border-radius:999px; padding:.45rem .7rem; color:#9b1d67; background:white; font:inherit; font-weight:800; cursor:pointer; }
dl { display:grid; grid-template-columns:minmax(110px,.45fr) 1fr; gap:.6rem 1rem; }
dt { color:#64748b; } dd { margin:0; overflow-wrap:anywhere; }
pre { max-height:400px; overflow:auto; border-radius:.8rem; padding:.8rem; background:#17133f; color:#f7f5ff; }
small,.empty,.empty-state p { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#f0ebff; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:980px) { header { flex-direction:column; } .layout { grid-template-columns:1fr; } }
@media (max-width:620px) { .filters { grid-template-columns:1fr; width:100%; } .receipts article { grid-template-columns:1fr; } }
</style>
