<script setup lang="ts">
import MbHeader from './MbHeader.vue'
import MbFooter from './MbFooter.vue'
</script>

<template>
  <div class="marketing-route">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <MbHeader />
    <div id="main-content">
      <slot />
    </div>
    <MbFooter />
  </div>
</template>

<style scoped>
.marketing-route {
  min-height: 100vh;
  background: var(--mb-color-bg);
  color: var(--mb-color-text);
}

.skip-link {
  position: fixed;
  z-index: 100;
  top: var(--mb-space-3);
  left: var(--mb-space-3);
  padding: var(--mb-space-3) var(--mb-space-4);
  border-radius: var(--mb-radius-sm);
  background: var(--mb-color-accent);
  color: var(--mb-color-bg-deep);
  font-size: var(--mb-text-sm);
  font-weight: var(--mb-weight-semibold);
  transform: translateY(-200%);
}

.skip-link:focus-visible {
  transform: translateY(0);
}
</style>
