<script setup lang="ts">
import CookieConsent from "./components/CookieConsent.vue"
import PortfolioFooter from "./components/PortfolioFooter.vue"
</script>

<template>
  <div class="shell">
    <a class="moneybee-skip-link" href="#main-content">Skip to main content</a>
    <div id="main-content">
      <RouterView />
    </div>
    <PortfolioFooter />
    <CookieConsent />
  </div>
</template>

<style scoped>
.moneybee-skip-link {
  position: fixed;
  inset: 1rem auto auto 1rem;
  z-index: 100;
  transform: translateY(-200%);
  padding: .75rem 1rem;
  border-radius: 4px;
  background: #fff;
  color: #07090c;
  font-weight: 800;
  text-decoration: none;
}
.moneybee-skip-link:focus { transform: translateY(0); }
</style>
