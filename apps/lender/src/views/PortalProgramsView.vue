<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  getAuthContext,
  listLenderPrograms,
  updateLenderProgram,
  type LenderProgram,
  type LenderProgramPatch,
} from "@moneybee/api-client";

const organizationId = ref("");
const programs = ref<LenderProgram[]>([]);
const selected = ref<LenderProgram | null>(null);
const form = reactive({
  name: "",
  productType: "",
  minAmount: "",
  maxAmount: "",
  minCreditScore: "",
  minRevenue: "",
  monthsInBusiness: "",
  states: "",
  active: true,
});
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

function edit(program: LenderProgram): void {
  selected.value = program;
  form.name = program.name;
  form.productType = program.product_type;
  form.minAmount = program.min_amount ?? "";
  form.maxAmount = program.max_amount ?? "";
  form.minCreditScore = program.min_credit_score?.toString() ?? "";
  form.minRevenue = program.min_monthly_revenue ?? "";
  form.monthsInBusiness = program.min_time_in_business_months?.toString() ?? "";
  form.states = program.allowed_states.join(", ");
  form.active = program.active;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    programs.value = await listLenderPrograms(undefined, organizationId.value);
    if (selected.value) {
      const refreshed = programs.value.find((program) => program.id === selected.value?.id);
      if (refreshed) edit(refreshed);
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Unable to load programs.";
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<void> {
  if (!selected.value) return;
  saving.value = true;
  error.value = "";
  success.value = "";
  const payload: LenderProgramPatch = {
    name: form.name.trim(),
    product_type: form.productType.trim(),
    min_amount: form.minAmount || null,
    max_amount: form.maxAmount || null,
    min_credit_score: form.minCreditScore ? Number(form.minCreditScore) : null,
    min_monthly_revenue: form.minRevenue || null,
    min_time_in_business_months: form.monthsInBusiness
      ? Number(form.monthsInBusiness)
      : null,
    allowed_states: form.states
      .split(",")
      .map((state) => state.trim().toUpperCase())
      .filter(Boolean),
    active: form.active,
  };
  try {
    const updated = await updateLenderProgram(
      selected.value.id,
      selected.value.version,
      payload,
      organizationId.value,
    );
    programs.value = programs.value.map((program) =>
      program.id === updated.id ? updated : program,
    );
    edit(updated);
    success.value = "Program changes were saved with a new resource version.";
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "The program could not be saved.";
    await load();
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">Credit programs</p>
      <h1>Manage product rules without silent overwrites.</h1>
      <p>Every edit includes the current version in <code>If-Match</code>. Conflicting updates are rejected and reloaded.</p>
    </header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="success" class="notice success" role="status">{{ success }}</p>
    <p v-if="loading" class="notice">Loading lender programs…</p>

    <section v-else class="layout">
      <aside>
        <button
          v-for="program in programs"
          :key="program.id"
          type="button"
          :class="['program', { active: selected?.id === program.id }]"
          @click="edit(program)"
        >
          <strong>{{ program.name }}</strong>
          <small>{{ program.product_type }} · v{{ program.version }}</small>
          <span>{{ program.active ? "ACTIVE" : "INACTIVE" }}</span>
        </button>
        <p v-if="!programs.length" class="empty">No lender programs are configured.</p>
      </aside>

      <form v-if="selected" @submit.prevent="save">
        <div class="heading"><div><p class="eyebrow">Program editor</p><h2>{{ selected.name }}</h2></div><span>Version {{ selected.version }}</span></div>
        <div class="fields">
          <label>Name<input v-model="form.name" required maxlength="240" /></label>
          <label>Product type<input v-model="form.productType" required maxlength="80" /></label>
          <label>Minimum amount<input v-model="form.minAmount" type="number" min="0" step="0.01" /></label>
          <label>Maximum amount<input v-model="form.maxAmount" type="number" min="0" step="0.01" /></label>
          <label>Minimum credit score<input v-model="form.minCreditScore" type="number" min="300" max="850" /></label>
          <label>Minimum monthly revenue<input v-model="form.minRevenue" type="number" min="0" step="0.01" /></label>
          <label>Months in business<input v-model="form.monthsInBusiness" type="number" min="0" /></label>
          <label>Allowed states<input v-model="form.states" placeholder="NY, NJ, FL" /></label>
          <label class="check"><input v-model="form.active" type="checkbox" /> Program active</label>
        </div>
        <button type="submit" :disabled="saving">{{ saving ? "Saving…" : "Save program" }}</button>
      </form>
      <article v-else class="empty-state"><h2>Select a program</h2><p>Choose a lender program to review its eligibility rules.</p></article>
    </section>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1280px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header { max-width:900px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.75rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#006454; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.layout { display:grid; grid-template-columns:minmax(260px,.8fr) minmax(0,2fr); gap:1rem; }
aside,form,.empty-state { border:1px solid #dce7e4; border-radius:1.4rem; padding:1rem; background:white; box-shadow:0 14px 40px rgb(10 37 64 / 7%); }
.program { display:grid; width:100%; gap:.3rem; margin-bottom:.55rem; border:1px solid transparent; border-radius:1rem; padding:.85rem; text-align:left; background:#f6faf9; font:inherit; cursor:pointer; }
.program.active,.program:hover { border-color:#79c7b8; background:white; }
.program span { width:fit-content; border-radius:999px; padding:.25rem .55rem; color:#006454; background:#e7f7f3; font-size:.7rem; font-weight:850; }
.heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
.heading > span { border-radius:999px; padding:.35rem .65rem; color:#006454; background:#e7f7f3; font-weight:800; }
.fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
label { display:grid; gap:.45rem; font-weight:750; }
label.check { display:flex; align-items:center; }
input { min-height:44px; border:1px solid #cbd8d5; border-radius:.75rem; padding:.65rem .75rem; font:inherit; }
form > button { margin-top:1rem; min-height:44px; border:0; border-radius:999px; padding:.7rem 1rem; color:white; background:#006454; font:inherit; font-weight:850; cursor:pointer; }
button:disabled { opacity:.5; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#e7f7f3; }
.notice.error { color:#8d2115; background:#fff0ed; }
.notice.success { color:#146c43; background:#e9f8f0; }
@media (max-width:820px) { .layout,.fields { grid-template-columns:1fr; } }
</style>
