<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  getAuthContext,
  listAdminOrganizationMembers,
  listAdminOrganizations,
} from "@moneybee/api-client";

const organizationId = ref("");
const organizations = ref<Array<Record<string, unknown>>>([]);
const members = ref<Array<Record<string, unknown>>>([]);
const selectedId = ref("");
const typeFilter = ref("");
const loading = ref(true);
const error = ref("");

async function loadOrganizations(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    organizationId.value = context.active_organization_id;
    organizations.value = await listAdminOrganizations(
      { organization_type: typeFilter.value || undefined, limit: 500 },
      organizationId.value,
    );
    selectedId.value = selectedId.value || String(organizations.value[0]?.id ?? "");
    await loadMembers();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "Unable to load organizations.";
  } finally {
    loading.value = false;
  }
}

async function loadMembers(): Promise<void> {
  if (!selectedId.value) {
    members.value = [];
    return;
  }
  members.value = await listAdminOrganizationMembers(
    selectedId.value,
    organizationId.value,
  );
}

onMounted(loadOrganizations);
</script>

<template>
  <main class="page">
    <header><div><p class="eyebrow">Local identity and tenancy</p><h1>Organizations and authoritative memberships.</h1><p>Keycloak proves identity; MoneyBee local memberships, roles, and permissions decide application access.</p></div><label>Type<select v-model="typeFilter" @change="loadOrganizations"><option value="">All</option><option value="BORROWER">Borrower</option><option value="LENDER">Lender</option><option value="MONEYBEE">MoneyBee</option><option value="AFFILIATE">Affiliate</option></select></label></header>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice">Loading organizations…</p>
    <section v-else class="layout">
      <aside>
        <button v-for="organization in organizations" :key="String(organization.id)" type="button" :class="['organization', { active: String(organization.id) === selectedId }]" @click="selectedId = String(organization.id); loadMembers()"><strong>{{ organization.name ?? organization.id }}</strong><small>{{ organization.organization_type ?? "ORGANIZATION" }}</small><span>{{ organization.active === false ? "INACTIVE" : "ACTIVE" }}</span></button>
        <p v-if="!organizations.length" class="empty">No organizations match this filter.</p>
      </aside>
      <article class="members">
        <div class="heading"><div><p class="eyebrow">Memberships</p><h2>{{ selectedId || "Select an organization" }}</h2></div><button type="button" class="quiet" :disabled="!selectedId" @click="loadMembers">Refresh</button></div>
        <div v-if="members.length" class="rows">
          <section v-for="member in members" :key="String((member.membership as Record<string, unknown>)?.user_id)">
            <div><strong>{{ (member.user as Record<string, unknown>)?.display_name ?? (member.user as Record<string, unknown>)?.email ?? (member.membership as Record<string, unknown>)?.user_id }}</strong><small>{{ (member.user as Record<string, unknown>)?.email }}</small></div>
            <div class="badges"><span>{{ (member.membership as Record<string, unknown>)?.membership_type }}</span><span>{{ (member.membership as Record<string, unknown>)?.active === false ? "INACTIVE" : "ACTIVE" }}</span></div>
            <details><summary>External identities</summary><pre>{{ JSON.stringify(member.external_identities, null, 2) }}</pre></details>
          </section>
        </div>
        <p v-else class="empty">No memberships are recorded for this organization.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.4rem; max-width:1320px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header,.heading,.rows section { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
header > div { max-width:900px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#5b2fc4; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
header label { display:grid; gap:.4rem; font-weight:750; }
select { min-height:44px; border:1px solid #d1cbe4; border-radius:.75rem; padding:.65rem .75rem; font:inherit; }
.layout { display:grid; grid-template-columns:minmax(260px,.8fr) minmax(0,2fr); gap:1rem; }
aside,.members { border:1px solid #e0dcef; border-radius:1.3rem; padding:1rem; background:white; box-shadow:0 12px 36px rgb(23 19 63 / 7%); }
.organization { display:grid; width:100%; gap:.3rem; margin-bottom:.5rem; border:1px solid transparent; border-radius:1rem; padding:.85rem; text-align:left; background:#faf9fd; font:inherit; cursor:pointer; }
.organization.active,.organization:hover { border-color:#bba9ec; background:white; }
.organization span,.badges span { width:fit-content; border-radius:999px; padding:.25rem .55rem; color:#5b2fc4; background:#f0ebff; font-size:.7rem; font-weight:850; }
.rows { display:grid; }
.rows section { flex-wrap:wrap; padding:1rem 0; border-top:1px solid #e8e5f2; }
.rows section:first-child { border-top:0; }
.rows section > div:first-child { display:grid; gap:.25rem; }
.badges { display:flex; gap:.35rem; }
details { width:100%; }
pre { max-height:220px; overflow:auto; border-radius:.8rem; padding:.8rem; background:#17133f; color:#f7f5ff; }
.quiet { border:0; color:#5b2fc4; background:transparent; font:inherit; font-weight:800; cursor:pointer; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#f0ebff; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:820px) { header { flex-direction:column; } .layout { grid-template-columns:1fr; } }
</style>
