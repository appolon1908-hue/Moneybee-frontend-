<script setup lang="ts">
import { MONEYBEE_DOMAINS } from "@moneybee/ui/portfolio"
</script>

<template>
  <div class="portal">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">MB</span>
        <span class="brand-copy">
          <strong>MoneyBee Control Center</strong>
          <small>admin.moneybeeloan.com</small>
        </span>
      </div>
      <nav aria-label="Administration navigation">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/operations-portal">Operations portal</RouterLink>
        <RouterLink to="/leads">Leads</RouterLink>
        <RouterLink to="/applications">Applications</RouterLink>
        <RouterLink to="/lenders">Lender programs</RouterLink>
        <RouterLink to="/matches">Matches</RouterLink>
        <RouterLink to="/submissions">Submissions</RouterLink>
        <RouterLink to="/offers">Offers</RouterLink>
        <RouterLink to="/underwriting">Underwriting</RouterLink>
        <RouterLink to="/finance">Finance</RouterLink>
        <RouterLink to="/sla-alerts">SLA alerts</RouterLink>
        <RouterLink to="/users">Users</RouterLink>
        <RouterLink to="/operations">Lifecycle operations</RouterLink>
        <RouterLink to="/public-intakes">Public intakes</RouterLink>
        <RouterLink to="/crm-deliveries">CRM deliveries</RouterLink>
        <RouterLink to="/integration-inbox">Integration inbox</RouterLink>
        <RouterLink to="/operational-exceptions">Operational exceptions</RouterLink>
        <RouterLink to="/crm">CRM &amp; integrations</RouterLink>
        <RouterLink to="/audit">Audit</RouterLink>
        <RouterLink to="/system">System</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <header class="portal-topbar">
        <div class="portal-topbar__identity">
          <strong>Administration</strong>
          <span>admin.moneybeeloan.com</span>
        </div>
        <a class="button secondary" :href="MONEYBEE_DOMAINS.public">Public website</a>
      </header>
      <div class="portal-view"><RouterView /></div>
      <footer class="portal-footer">
        <span>MoneyBee administration · role and tenant controls remain authoritative</span>
        <nav aria-label="Administration footer">
          <a :href="MONEYBEE_DOMAINS.public + '/privacy'">Privacy</a>
          <a :href="MONEYBEE_DOMAINS.public + '/terms'">Terms</a>
          <a :href="MONEYBEE_DOMAINS.corporate">Codestra</a>
        </nav>
      </footer>
    </main>
  </div>
</template>
