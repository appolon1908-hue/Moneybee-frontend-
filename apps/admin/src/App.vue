<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue"
import {
  AUTH_MANAGER,
  hasPermission,
  type LocalPrincipal,
} from "@moneybee/auth"

interface NavigationItem {
  label: string
  path: string
  permission?: string
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

const auth = inject(AUTH_MANAGER)
const principal = ref<LocalPrincipal | null>(null)

const navigation: NavigationGroup[] = [
  {
    label: "Work",
    items: [
      {label: "Dashboard", path: "/dashboard"},
      {label: "Operations portal", path: "/operations-portal"},
      {label: "Applications", path: "/applications"},
      {label: "Underwriting", path: "/underwriting"},
      {label: "Offers", path: "/offers"},
      {label: "SLA alerts", path: "/sla-alerts"},
    ],
  },
  {
    label: "Marketplace",
    items: [
      {label: "Leads", path: "/leads"},
      {label: "Lender programs", path: "/lenders"},
      {label: "Matches", path: "/matches"},
      {label: "Submissions", path: "/submissions"},
      {label: "Lifecycle operations", path: "/operations"},
    ],
  },
  {
    label: "Finance & compliance",
    items: [
      {label: "Financial ledger", path: "/finance"},
      {
        label: "Compliance records",
        path: "/compliance",
        permission: "compliance.read",
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {label: "Public intakes", path: "/public-intakes"},
      {label: "CRM deliveries", path: "/crm-deliveries"},
      {label: "Integration inbox", path: "/integration-inbox"},
      {label: "Operational exceptions", path: "/operational-exceptions"},
      {label: "CRM control", path: "/crm"},
    ],
  },
  {
    label: "Administration",
    items: [
      {label: "Users", path: "/users"},
      {label: "Audit", path: "/audit"},
      {label: "System readiness", path: "/system"},
    ],
  },
]

const visibleNavigation = computed(() => navigation
  .map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasPermission(principal.value, item.permission),
    ),
  }))
  .filter((group) => group.items.length > 0),
)

onMounted(async () => {
  principal.value = await auth?.getLocalPrincipal() || null
})
</script>

<template>
  <div class="portal">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard" aria-label="MoneyBee Control Center home">
        <span class="mark" aria-hidden="true">MB</span>
        <span><strong>MoneyBee</strong><small>Control Center</small></span>
      </RouterLink>
      <nav aria-label="Control Center navigation">
        <section v-for="group in visibleNavigation" :key="group.label" class="nav-group">
          <p>{{ group.label }}</p>
          <RouterLink v-for="item in group.items" :key="item.path" :to="item.path">
            {{ item.label }}
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
