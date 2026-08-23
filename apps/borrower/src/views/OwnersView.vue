<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { api } from "@moneybee/api-client"

type Owner = {
  id: string
  first_name: string
  last_name: string
  ownership_percent: number
  title: string | null
  email: string | null
  phone: string | null
}

const applicationId = import.meta.env.VITE_DEMO_APPLICATION_ID || ""
const owners = ref<Owner[]>([])
const busy = ref(false)
const message = ref("")
const error = ref("")
const owner = reactive({
  first_name: "",
  last_name: "",
  ownership_percent: 100,
  title: "",
  email: "",
  phone: "",
})

function describe(caught: unknown) {
  return caught instanceof Error ? caught.message : "Request failed"
}

async function refresh() {
  if (!applicationId) return
  owners.value = await api<Owner[]>(`/applications/${applicationId}/owners`)
}

onMounted(async () => {
  try {
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  }
})

async function add() {
  busy.value = true
  message.value = ""
  error.value = ""
  try {
    await api(`/applications/${applicationId}/owners`, {
      method: "POST",
      body: JSON.stringify({
        ...owner,
        title: owner.title || null,
        email: owner.email || null,
        phone: owner.phone || null,
        address: {},
      }),
    })
    Object.assign(owner, {
      first_name: "",
      last_name: "",
      ownership_percent: 100,
      title: "",
      email: "",
      phone: "",
    })
    message.value = "Owner added."
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

async function remove(ownerId: string) {
  busy.value = true
  error.value = ""
  try {
    await api(`/applications/${applicationId}/owners/${ownerId}`, {
      method: "DELETE",
    })
    message.value = "Owner removed."
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="container">
    <span class="eyebrow">APPLICATION · OWNERS</span>
    <h2>Business owners</h2>
    <p class="lede">Add every owner whose information is required for underwriting.</p>
    <div v-if="!applicationId" class="card error">
      Set VITE_DEMO_APPLICATION_ID after creating a local application.
    </div>
    <template v-else>
      <div v-if="message" class="card notice" role="status">{{ message }}</div>
      <div v-if="error" class="card error" role="alert">{{ error }}</div>
      <section class="card section">
        <div v-for="row in owners" :key="row.id" class="owner-row">
          <div>
            <strong>{{ row.first_name }} {{ row.last_name }}</strong>
            <small>{{ row.ownership_percent }}% ownership</small>
          </div>
          <button class="secondary" :disabled="busy" @click="remove(row.id)">Remove</button>
        </div>
        <div class="form-grid">
          <label>First name<input v-model="owner.first_name" autocomplete="given-name" /></label>
          <label>Last name<input v-model="owner.last_name" autocomplete="family-name" /></label>
          <label>Ownership %<input v-model.number="owner.ownership_percent" type="number" min="0.01" max="100" step="0.01" /></label>
          <label>Title<input v-model="owner.title" autocomplete="organization-title" /></label>
          <label>Email<input v-model="owner.email" type="email" autocomplete="email" /></label>
          <label>Phone<input v-model="owner.phone" type="tel" autocomplete="tel" /></label>
        </div>
        <button :disabled="busy || !owner.first_name || !owner.last_name" @click="add">
          {{ busy ? "Saving…" : "Add owner" }}
        </button>
      </section>
    </template>
  </main>
</template>
