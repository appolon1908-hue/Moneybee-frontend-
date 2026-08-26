<script setup lang="ts">
import { ref } from "vue";
import {
  getAuthContext,
  searchAdminPortal,
  type AdminSearchResults,
} from "@moneybee/api-client";

const query = ref("");
const results = ref<AdminSearchResults | null>(null);
const loading = ref(false);
const error = ref("");

async function search(): Promise<void> {
  if (query.value.trim().length < 2) return;
  loading.value = true;
  error.value = "";
  try {
    const context = await getAuthContext();
    results.value = await searchAdminPortal(
      query.value.trim(),
      context.active_organization_id,
    );
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Search failed.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page">
    <header><p class="eyebrow">Global operations search</p><h1>Find the record. Keep authority in MoneyBee.</h1><p>Search is restricted to authenticated MoneyBee administrators and returns controlled summaries rather than storage credentials or raw provider payloads.</p></header>
    <form @submit.prevent="search"><label for="search">Lead, user, or organization</label><div><input id="search" v-model="query" minlength="2" maxlength="200" placeholder="Business name, email, phone, or organization" /><button type="submit" :disabled="loading || query.trim().length < 2">{{ loading ? "Searching…" : "Search" }}</button></div></form>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <template v-if="results">
      <section><p class="eyebrow">Leads</p><h2>{{ results.leads.length }} result(s)</h2><div class="cards"><article v-for="lead in results.leads" :key="String(lead.id)"><strong>{{ lead.business_name ?? "Unnamed business" }}</strong><span>{{ lead.status ?? "NEW" }}</span><small>{{ lead.email ?? "No email" }}</small><small>{{ lead.phone ?? "No phone" }}</small></article><p v-if="!results.leads.length" class="empty">No leads matched.</p></div></section>
      <section><p class="eyebrow">Organizations</p><h2>{{ results.organizations.length }} result(s)</h2><div class="cards"><article v-for="organization in results.organizations" :key="String(organization.id)"><strong>{{ organization.name ?? organization.id }}</strong><span>{{ organization.organization_type ?? "ORGANIZATION" }}</span><small>{{ organization.active === false ? "Inactive" : "Active" }}</small></article><p v-if="!results.organizations.length" class="empty">No organizations matched.</p></div></section>
      <section><p class="eyebrow">Users</p><h2>{{ results.users.length }} result(s)</h2><div class="cards"><article v-for="user in results.users" :key="String(user.id)"><strong>{{ user.display_name ?? user.email ?? user.id }}</strong><span>{{ user.active === false ? "INACTIVE" : "ACTIVE" }}</span><small>{{ user.email }}</small></article><p v-if="!results.users.length" class="empty">No users matched.</p></div></section>
    </template>
  </main>
</template>

<style scoped>
.page { display:grid; gap:1.6rem; max-width:1200px; margin:0 auto; padding:clamp(1.25rem,4vw,3.5rem); }
header { max-width:920px; }
h1,h2,p { margin-top:0; }
h1 { font-size:clamp(2.2rem,5.5vw,4.8rem); line-height:.96; letter-spacing:-.055em; }
.eyebrow { margin-bottom:.4rem; color:#5b2fc4; font-size:.75rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
form { border:1px solid #e0dcef; border-radius:1.3rem; padding:1.2rem; background:white; box-shadow:0 12px 36px rgb(23 19 63 / 7%); }
form label { display:block; margin-bottom:.5rem; font-weight:800; }
form div { display:grid; grid-template-columns:1fr auto; gap:.75rem; }
input,button { min-height:48px; border:1px solid #d1cbe4; border-radius:.85rem; padding:.7rem .85rem; font:inherit; }
button { border-color:#5b2fc4; color:white; background:#5b2fc4; font-weight:850; cursor:pointer; }
.cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.85rem; }
.cards article { display:grid; gap:.45rem; border:1px solid #e0dcef; border-radius:1.15rem; padding:1rem; background:white; box-shadow:0 10px 30px rgb(23 19 63 / 6%); }
.cards span { width:fit-content; border-radius:999px; padding:.25rem .55rem; color:#5b2fc4; background:#f0ebff; font-size:.72rem; font-weight:850; }
small,.empty { color:#64748b; }
.notice { margin:0; border-radius:1rem; padding:1rem; background:#f0ebff; }
.notice.error { color:#8d2115; background:#fff0ed; }
@media (max-width:800px) { .cards { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:560px) { form div,.cards { grid-template-columns:1fr; } }
</style>
