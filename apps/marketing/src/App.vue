<script setup lang="ts">
import CookieConsent from "./components/CookieConsent.vue"
</script>
<template>
  <div class="shell">
    <RouterView />
    <CookieConsent />
  </div>
</template>
