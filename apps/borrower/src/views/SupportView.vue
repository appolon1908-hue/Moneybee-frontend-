<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { api } from "@moneybee/api-client"

type Complaint = {
  id: string
  category: string
  description: string
  priority: string
  status: string
  created_at: string
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const rows = ref<Complaint[]>([])
const busy = ref(false)
const message = ref("")
const error = ref("")
const form = reactive({
  category: "APPLICATION_SUPPORT",
  description: "",
  priority: "NORMAL",
})

async function load() {
  if (!applicationId) return
  try {
    rows.value = await api<Complaint[]>(
      `/applications/${applicationId}/complaints`,
    )
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

async function submit() {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await api(`/applications/${applicationId}/complaints`, {
      method: "POST",
      body: JSON.stringify(form),
    })
    form.description = ""
    message.value = "Your support request was recorded."
    await load()
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
    <span class="eyebrow">SUPPORT</span>
    <h2>Application support</h2>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <template v-else>
      <div v-if="message" class="card notice" role="status">{{ message }}</div>
      <div v-if="error" class="card error" role="alert">{{ error }}</div>
      <section class="card grid">
        <label>
          Category
          <select v-model="form.category">
            <option>APPLICATION_SUPPORT</option>
            <option>OFFER_QUESTION</option>
            <option>ACCESSIBILITY</option>
            <option>PRIVACY</option>
          </select>
        </label>
        <label>
          Priority
          <select v-model="form.priority">
            <option>NORMAL</option>
            <option>HIGH</option>
            <option>URGENT</option>
          </select>
        </label>
        <label>
          How can we help?
          <textarea v-model="form.description" rows="5" maxlength="10000"></textarea>
        </label>
        <button
          :disabled="busy || form.description.trim().length < 10"
          @click="submit"
        >
          Send support request
        </button>
      </section>
      <h3>Previous requests</h3>
      <div class="grid two">
        <article v-for="row in rows" :key="row.id" class="card grid">
          <span class="eyebrow">{{ row.status }}</span>
          <strong>{{ row.category.replaceAll("_", " ") }}</strong>
          <p>{{ row.description }}</p>
        </article>
      </div>
    </template>
  </main>
</template>

<style scoped>
label {
  display: grid;
  gap: 7px;
  font-weight: 700;
}
select,
textarea {
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  font: inherit;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
</style>
