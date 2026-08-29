<script setup lang="ts">
import { onMounted, ref } from "vue"
import { api } from "@moneybee/api-client"

type NotificationPreferences = {
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
}

const preferences = ref<NotificationPreferences>({
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
})
const busy = ref(false)
const error = ref("")
const message = ref("")

async function load() {
  error.value = ""
  try {
    preferences.value = await api<NotificationPreferences>("/me/notification-preferences")
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function save() {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    preferences.value = await api<NotificationPreferences>("/me/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(preferences.value),
    })
    message.value = "Notification preferences saved."
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Settings</h2>
    <p class="muted">
      Notification preferences for this account. Program eligibility rules
      live under Programs; user and organization management is handled in
      Keycloak.
    </p>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div class="card grid">
      <label class="toggle">
        <input v-model="preferences.email_enabled" type="checkbox" />
        Email notifications
      </label>
      <label class="toggle">
        <input v-model="preferences.sms_enabled" type="checkbox" />
        SMS notifications
      </label>
      <label class="toggle">
        <input v-model="preferences.in_app_enabled" type="checkbox" />
        In-app notifications
      </label>
      <button :disabled="busy" @click="save">Save preferences</button>
    </div>
  </main>
</template>

<style scoped>
.toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
</style>
