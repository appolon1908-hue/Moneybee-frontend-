<script setup lang="ts">
import { ref } from 'vue'
import { getApplication, submitApplication, type Application } from '../api'

const id = ref('')
const application = ref<Application | null>(null)
const error = ref('')
async function load() { try { application.value = await getApplication(id.value); error.value = '' } catch (e) { error.value = e instanceof Error ? e.message : 'Unable to load' } }
async function submit() { if (!application.value) return; application.value = await submitApplication(application.value.id) }
</script>

<template>
  <section class="panel">
    <h1>Client portal</h1>
    <div class="inline"><input v-model.trim="id" placeholder="Application ID" /><button @click="load">Load</button></div>
    <p v-if="error" class="error">{{ error }}</p>
    <article v-if="application" class="card">
      <h2>{{ application.company_name }}</h2>
      <p>Status: <strong>{{ application.status }}</strong></p>
      <p>Requested: ${{ application.requested_amount.toLocaleString() }}</p>
      <button v-if="application.status === 'draft'" class="primary" @click="submit">Submit application</button>
    </article>
  </section>
</template>
