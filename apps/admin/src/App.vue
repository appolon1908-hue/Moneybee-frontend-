<script setup lang="ts">
const navigation = [
  {
    label: "Work",
    items: [
      ["Dashboard", "/dashboard"],
      ["Operations portal", "/operations-portal"],
      ["Applications", "/applications"],
      ["Underwriting", "/underwriting"],
      ["Offers", "/offers"],
      ["SLA alerts", "/sla-alerts"],
    ],
  },
  {
    label: "Marketplace",
    items: [
      ["Leads", "/leads"],
      ["Lender programs", "/lenders"],
      ["Matches", "/matches"],
      ["Submissions", "/submissions"],
      ["Lifecycle operations", "/operations"],
    ],
  },
  {
    label: "Finance & compliance",
    items: [
      ["Financial ledger", "/finance"],
      ["Compliance records", "/compliance"],
    ],
  },
  {
    label: "Integrations",
    items: [
      ["Public intakes", "/public-intakes"],
      ["CRM deliveries", "/crm-deliveries"],
      ["Integration inbox", "/integration-inbox"],
      ["Operational exceptions", "/operational-exceptions"],
      ["CRM control", "/crm"],
    ],
  },
  {
    label: "Administration",
    items: [
      ["Users", "/users"],
      ["Audit", "/audit"],
      ["System readiness", "/system"],
    ],
  },
] as const
</script>

<template>
  <div class="portal">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard" aria-label="MoneyBee Control Center home">
        <span class="mark" aria-hidden="true">MB</span>
        <span><strong>MoneyBee</strong><small>Control Center</small></span>
      </RouterLink>
      <nav aria-label="Control Center navigation">
        <section v-for="group in navigation" :key="group.label" class="nav-group">
          <p>{{ group.label }}</p>
          <RouterLink v-for="item in group.items" :key="item[1]" :to="item[1]">
            {{ item[0] }}
          </RouterLink>
        </section>
      </nav>
      <p class="safety-note">External delivery and money movement remain capability-gated by the backend.</p>
    </aside>
    <main class="content"><RouterView /></main>
  </div>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
.brand { color: white; text-decoration: none; }
.brand > span:last-child { display: grid; gap: 2px; }
.brand small { color: #cbd5e1; font-size: .76rem; font-weight: 600; }
.sidebar nav { display: grid; gap: 24px; margin-top: 0; }
.nav-group { display: grid; gap: 4px; }
.nav-group p { margin: 0 0 6px; color: #94a3b8; font-size: .72rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
.nav-group a { border-radius: 8px; padding: 9px 10px; color: #e2e8f0; font-weight: 700; }
.nav-group a:hover { background: rgba(255, 255, 255, .08); color: white; }
.nav-group a.router-link-active { background: rgba(245, 185, 66, .14); color: var(--gold); }
.safety-note { margin-top: auto; color: #94a3b8; font-size: .75rem; line-height: 1.5; }
@media (max-width: 780px) {
  .sidebar { max-height: none; }
  .sidebar nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
