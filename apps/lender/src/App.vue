<script setup lang="ts">
import { MONEYBEE_DOMAINS } from "@moneybee/ui/portfolio"
</script>

<template>
  <div class="portal">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">MB</span>
        <span class="brand-copy">
          <strong>MoneyBee Partner Network</strong>
          <small>lenders.moneybeeloan.com</small>
        </span>
      </div>
      <nav aria-label="Lender navigation">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/applications">Applications</RouterLink>
        <RouterLink to="/programs">Programs</RouterLink>
        <RouterLink to="/offers">Offers</RouterLink>
        <RouterLink to="/funded-deals">Funded deals</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <header class="portal-topbar">
        <div class="portal-topbar__identity">
          <strong>Lender portal</strong>
          <span>lenders.moneybeeloan.com</span>
        </div>
        <a class="button secondary" :href="MONEYBEE_DOMAINS.public + '/for-lenders'">Lender information</a>
      </header>
      <div class="portal-view"><RouterView /></div>
      <footer class="portal-footer">
        <span>MoneyBee lender workspace · protected by Codestra identity</span>
        <nav aria-label="Lender portal footer">
          <a :href="MONEYBEE_DOMAINS.public + '/privacy'">Privacy</a>
          <a :href="MONEYBEE_DOMAINS.public + '/terms'">Terms</a>
          <a :href="MONEYBEE_DOMAINS.corporate">Codestra</a>
        </nav>
      </footer>
    </main>
  </div>
</template>
