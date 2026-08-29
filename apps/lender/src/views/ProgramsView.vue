<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { api, money } from "@moneybee/api-client"
import { StatusBadge } from "@moneybee/ui"

type Program = {
  id: string
  lender_id: string
  name: string
  product_type: string
  min_amount: string
  max_amount: string
  minimum_monthly_revenue: string
  minimum_time_in_business_months: number
  states: string[]
  excluded_industries: string[]
  active: boolean
  version: number
  updated_at: string
}

const rows = ref<Program[]>([])
const includeInactive = ref(false)
const editingId = ref("")
const busy = ref(false)
const error = ref("")
const message = ref("")
const form = reactive({
  min_amount: "",
  max_amount: "",
  minimum_monthly_revenue: "",
  minimum_time_in_business_months: "",
  states: "",
  excluded_industries: "",
  active: true,
})

async function load() {
  error.value = ""
  try {
    rows.value = await api<Program[]>(
      `/lender/programs?include_inactive=${includeInactive.value}`,
    )
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Request failed"
  }
}

function edit(program: Program) {
  editingId.value = program.id
  form.min_amount = program.min_amount
  form.max_amount = program.max_amount
  form.minimum_monthly_revenue = program.minimum_monthly_revenue
  form.minimum_time_in_business_months = String(program.minimum_time_in_business_months)
  form.states = program.states.join(", ")
  form.excluded_industries = program.excluded_industries.join(", ")
  form.active = program.active
}

function cancel() {
  editingId.value = ""
}

async function save(program: Program) {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await api(`/lender/programs/${program.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: program.version,
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        minimum_monthly_revenue: Number(form.minimum_monthly_revenue),
        minimum_time_in_business_months: Number(form.minimum_time_in_business_months),
        states: form.states.split(",").map((state) => state.trim()).filter(Boolean),
        excluded_industries: form.excluded_industries
          .split(",")
          .map((industry) => industry.trim())
          .filter(Boolean),
        active: form.active,
      }),
    })
    message.value = `${program.name} updated.`
    editingId.value = ""
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
    <span class="eyebrow">LENDER PORTAL</span>
    <h2>Programs</h2>
    <p class="muted">
      Eligibility criteria used for automatic borrower-to-lender matching.
    </p>
    <label class="toggle">
      <input v-model="includeInactive" type="checkbox" @change="load" />
      Show inactive programs
    </label>
    <div v-if="message" class="card notice" role="status">{{ message }}</div>
    <div v-if="error" class="card error" role="alert">{{ error }}</div>
    <div v-if="!rows.length" class="card">No programs found.</div>
    <div class="grid two">
      <article v-for="program in rows" :key="program.id" class="card grid">
        <StatusBadge :status="program.active ? 'ACTIVE' : 'INACTIVE'" />
        <strong>{{ program.name }}</strong>
        <small>{{ program.product_type }} · v{{ program.version }}</small>
        <small>
          {{ money(program.min_amount) }} – {{ money(program.max_amount) }}
        </small>
        <small>
          Min monthly revenue {{ money(program.minimum_monthly_revenue) }} ·
          min {{ program.minimum_time_in_business_months }}mo in business
        </small>
        <small v-if="program.states.length">States: {{ program.states.join(", ") }}</small>
        <small v-if="program.excluded_industries.length">
          Excludes: {{ program.excluded_industries.join(", ") }}
        </small>
        <button class="secondary" @click="edit(program)">Edit</button>

        <div v-if="editingId === program.id" class="grid edit-form">
          <label>
            Min amount
            <input v-model="form.min_amount" type="number" min="1" />
          </label>
          <label>
            Max amount
            <input v-model="form.max_amount" type="number" min="1" />
          </label>
          <label>
            Min monthly revenue
            <input v-model="form.minimum_monthly_revenue" type="number" min="0" />
          </label>
          <label>
            Min months in business
            <input v-model="form.minimum_time_in_business_months" type="number" min="0" />
          </label>
          <label>
            States (comma separated, blank = all)
            <input v-model="form.states" placeholder="FL, GA, TX" />
          </label>
          <label>
            Excluded industries (comma separated)
            <input v-model="form.excluded_industries" placeholder="CANNABIS, ADULT" />
          </label>
          <label class="toggle">
            <input v-model="form.active" type="checkbox" />
            Active
          </label>
          <div class="grid two">
            <button :disabled="busy" @click="save(program)">Save</button>
            <button class="secondary" :disabled="busy" @click="cancel">Cancel</button>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
label {
  display: grid;
  gap: 7px;
  font-weight: 700;
}
.toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin: 12px 0;
}
input {
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  font: inherit;
}
.edit-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
</style>
