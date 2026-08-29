<script setup lang="ts">
import { onMounted, ref } from "vue"

const storageKey = "moneybee.cookie_consent.v1"
const visible = ref(false)

onMounted(() => {
  visible.value = window.localStorage.getItem(storageKey) !== "accepted"
})

function accept(): void {
  window.localStorage.setItem(storageKey, "accepted")
  visible.value = false
}
</script>

<template>
  <aside v-if="visible" class="cookie-banner" aria-label="Cookie notice">
    <div>
      <strong>Cookie notice</strong>
      <p>
        MoneyBee uses essential storage for forms and security. Advertising or analytics
        storage must follow consent choices and our policy pages.
      </p>
    </div>
    <div class="cookie-actions">
      <a href="/cookie-notice">Details</a>
      <button type="button" @click="accept">Accept</button>
    </div>
  </aside>
</template>
