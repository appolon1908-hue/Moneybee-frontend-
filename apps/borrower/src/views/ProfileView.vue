<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@moneybee/api-client"

const preferences = reactive({
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
})
const busy = ref(false)
const message = ref("")
const error = ref("")

onMounted(async () => {
  try {
    Object.assign(
      preferences,
      await getNotificationPreferences(),
    )
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
})

async function save() {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await updateNotificationPreferences(preferences)
    message.value = "Notification preferences saved."
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="container">
    <span class="eyebrow">ACCOUNT</span>
    <h2>Profile preferences</h2>
    <p class="lede">Choose how MoneyBee may send application updates.</p>
    <section class="card section">
      <div v-if="message" class="notice" role="status">{{ message }}</div>
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <label class="check"><input v-model="preferences.email_enabled" type="checkbox" /> Email</label>
      <label class="check"><input v-model="preferences.sms_enabled" type="checkbox" /> SMS</label>
      <label class="check"><input v-model="preferences.in_app_enabled" type="checkbox" /> In-app</label>
      <button :disabled="busy" @click="save">
        {{ busy ? "Saving…" : "Save preferences" }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.check { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.check input { width: auto; min-height: auto; }
</style>
