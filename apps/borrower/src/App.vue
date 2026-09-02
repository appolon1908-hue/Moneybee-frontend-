<script setup lang="ts">
import { MONEYBEE_DOMAINS } from "@moneybee/ui/portfolio"
</script>

<template>
  <div class="portal">
    <aside class="sidebar">
      <div class="brand">
        <span class="mark">MB</span>
        <span class="brand-copy">
          <strong>MoneyBee Borrower</strong>
          <small>app.moneybeeloan.com</small>
        </span>
      </div>
      <nav aria-label="Borrower navigation">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/application">Application overview</RouterLink>
        <RouterLink to="/business">Business</RouterLink>
        <RouterLink to="/financials">Financials</RouterLink>
        <RouterLink to="/owners">Owners</RouterLink>
        <RouterLink to="/documents">Documents</RouterLink>
        <RouterLink to="/banking">Banking</RouterLink>
        <RouterLink to="/verification">Verification</RouterLink>
        <RouterLink to="/conditions">Conditions</RouterLink>
        <RouterLink to="/offers">Funding offers</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
        <RouterLink to="/support">Support</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <header class="portal-topbar">
        <div class="portal-topbar__identity">
          <strong>Borrower portal</strong>
          <span>app.moneybeeloan.com</span>
        </div>
        <a class="button secondary" :href="MONEYBEE_DOMAINS.public">Public website</a>
      </header>
      <div class="portal-view"><RouterView /></div>
      <footer class="portal-footer">
        <span>MoneyBee borrower workspace · protected by Codestra identity</span>
        <nav aria-label="Borrower portal footer">
          <a :href="MONEYBEE_DOMAINS.public + '/privacy'">Privacy</a>
          <a :href="MONEYBEE_DOMAINS.public + '/terms'">Terms</a>
          <a :href="MONEYBEE_DOMAINS.corporate">Codestra</a>
        </nav>
      </footer>
    </main>
  </div>
</template>
