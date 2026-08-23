<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createApplication } from '../api'
import { currentUser, login } from '../auth'

const form = reactive({ company_name: '', contact_name: '', email: '', phone: '', requested_amount: 25000, annual_revenue: 100000, consent_to_terms: false })
const authenticated = ref(false)
const result = ref('')
const error = ref('')
const busy = ref(false)

onMounted(async () => { authenticated.value = Boolean(await currentUser()) })

async function submit() {
  busy.value = true; error.value = ''; result.value = ''
  try {
    if (!(await currentUser())) { await login('/apply'); return }
    if (!form.consent_to_terms) throw new Error('You must accept the current application terms before creating an application')
    const application = await createApplication({ ...form, consent_version: '2026-08-23-v1', consent_to_terms: true })
    result.value = `Application ${application.id} created. Sign in to submit and track it.`
  } catch (e) { error.value = e instanceof Error ? e.message : 'Unable to create application' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="panel narrow">
    <h1>Business funding application</h1>
    <div v-if="!authenticated" class="notice">
      <p>Secure sign-in is required before MoneyBee stores a funding application.</p>
      <button class="primary" @click="login('/apply')">Sign in to continue</button>
    </div>
    <form v-else @submit.prevent="submit">
      <label>Business name<input v-model.trim="form.company_name" required minlength="2" /></label>
      <label>Contact name<input v-model.trim="form.contact_name" required minlength="2" /></label>
      <label>Email<input v-model.trim="form.email" required type="email" autocomplete="email" /></label>
      <label>Phone<input v-model.trim="form.phone" required type="tel" autocomplete="tel" /></label>
      <label>Requested amount<input v-model.number="form.requested_amount" required type="number" min="1" step="100" /></label>
      <label>Annual revenue<input v-model.number="form.annual_revenue" type="number" min="1" step="100" /></label>
      <label class="check"><input v-model="form.consent_to_terms" type="checkbox" required /> I agree to the current application terms and privacy notice.</label>
      <p class="disclosure">Creating an application requires secure sign-in and does not guarantee approval or funding. Additional disclosures and consent may be required before regulated data pulls or lender submission.</p>
      <button class="primary" :disabled="busy">{{ busy ? 'Submitting…' : 'Create application' }}</button>
    </form>
    <p v-if="result" class="success" role="status">{{ result }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </section>
</template>
