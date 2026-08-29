<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import {
  ApiProblem,
  authorizeCredit,
  createBorrowerOwner,
  createRequirementSnapshot,
  deleteBorrowerOwner,
  getActiveBorrowerApplication,
  getAuthContext,
  getBorrowerApplicationRequirements,
  getBorrowerBusinessProfile,
  getBorrowerFinancialProfile,
  listCreditAuthorizations,
  listBorrowerOwners,
  listRequirementSnapshots,
  saveBorrowerBusinessProfile,
  saveBorrowerFinancialProfile,
  submitBorrowerApplication,
  type CreditAuthorization,
  type RequirementSnapshot,
} from "@moneybee/api-client"

type Business = {
  legal_name: string
  dba: string | null
  entity_type: string | null
  state_formed: string | null
  industry: string | null
  naics: string | null
  website: string | null
  address: Record<string, string>
}

type FinancialProfile = {
  annual_revenue: number | string | null
  monthly_revenue: number | string | null
  monthly_expenses: number | string | null
  existing_debt: number | string | null
  existing_positions: number
}

type Owner = {
  id: string
  first_name: string
  last_name: string
  ownership_percent: number | string
  title: string | null
  email: string | null
  phone: string | null
}

type Requirements = {
  completion_percentage: number
  ready_to_submit: boolean
  requirements: Array<{code: string; label: string; complete: boolean}>
}

const organizationId = ref("")
const applicationId = ref("")
const loading = ref(true)
const busy = ref(false)
const message = ref("")
const error = ref("")
const owners = ref<Owner[]>([])
const requirements = ref<Requirements | null>(null)
const creditAuthorizations = ref<CreditAuthorization[]>([])
const requirementSnapshots = ref<RequirementSnapshot[]>([])
const creditAccepted = ref(false)
const creditAuthorizationVersion = ref("credit-pull-v1")

const business = reactive<Business>({
  legal_name: "",
  dba: null,
  entity_type: null,
  state_formed: null,
  industry: null,
  naics: null,
  website: null,
  address: {},
})

const financial = reactive<FinancialProfile>({
  annual_revenue: null,
  monthly_revenue: null,
  monthly_expenses: null,
  existing_debt: null,
  existing_positions: 0,
})

const newOwner = reactive({
  first_name: "",
  last_name: "",
  ownership_percent: 100,
  title: "",
  email: "",
  phone: "",
})

async function optionalGet<T>(loader: () => Promise<T>): Promise<T | null> {
  try {
    return await loader()
  } catch (caught) {
    if (caught instanceof ApiProblem && caught.status === 404) return null
    throw caught
  }
}

function describeError(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Request failed"
}

async function refresh() {
  loading.value = true
  error.value = ""
  try {
    const context = await getAuthContext()
    organizationId.value = context.active_organization_id ?? ""
    const application = await getActiveBorrowerApplication(organizationId.value)
    applicationId.value = application?.id ?? ""
    if (!applicationId.value) {
      owners.value = []
      requirements.value = null
      creditAuthorizations.value = []
      requirementSnapshots.value = []
      return
    }
    const [
      savedBusiness,
      savedFinancial,
      savedOwners,
      savedRequirements,
      savedCreditAuthorizations,
      savedRequirementSnapshots,
    ] =
      await Promise.all([
        optionalGet<Business>(() =>
          getBorrowerBusinessProfile(applicationId.value, organizationId.value),
        ),
        optionalGet<FinancialProfile>(() =>
          getBorrowerFinancialProfile(applicationId.value, organizationId.value),
        ),
        listBorrowerOwners(applicationId.value, organizationId.value),
        getBorrowerApplicationRequirements(applicationId.value, organizationId.value),
        listCreditAuthorizations(applicationId.value, organizationId.value),
        listRequirementSnapshots(applicationId.value, organizationId.value),
      ])
    if (savedBusiness) Object.assign(business, savedBusiness)
    if (savedFinancial) Object.assign(financial, savedFinancial)
    owners.value = savedOwners
    requirements.value = savedRequirements
    creditAuthorizations.value = savedCreditAuthorizations
    requirementSnapshots.value = savedRequirementSnapshots
  } catch (caught) {
    error.value = describeError(caught)
  } finally {
    loading.value = false
  }
}

async function run(action: () => Promise<unknown>, success: string) {
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await action()
    message.value = success
    await refresh()
  } catch (caught) {
    error.value = describeError(caught)
  } finally {
    busy.value = false
  }
}

function saveBusiness() {
  return run(
    () =>
      saveBorrowerBusinessProfile(applicationId.value, business, organizationId.value),
    "Business information saved.",
  )
}

function saveFinancial() {
  return run(
    () =>
      saveBorrowerFinancialProfile(applicationId.value, financial, organizationId.value),
    "Financial profile saved.",
  )
}

async function addOwner() {
  await run(
    () =>
      createBorrowerOwner(
        applicationId.value,
        {
          ...newOwner,
          title: newOwner.title || null,
          email: newOwner.email || null,
          phone: newOwner.phone || null,
          address: {},
        },
        organizationId.value,
      ),
    "Owner added.",
  )
  Object.assign(newOwner, {
    first_name: "",
    last_name: "",
    ownership_percent: 100,
    title: "",
    email: "",
    phone: "",
  })
}

function deleteOwner(ownerId: string) {
  return run(
    () =>
      deleteBorrowerOwner(applicationId.value, ownerId, organizationId.value),
    "Owner removed.",
  )
}

function submitApplication() {
  return run(
    () =>
      submitBorrowerApplication(applicationId.value, organizationId.value),
    "Application submitted for matching.",
  )
}

function hashAuthorization(version: string): string {
  const seed = `moneybee:${applicationId.value}:${version}:credit-authorization`
  return Array.from(seed)
    .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 128)
    .padEnd(64, '0')
}

function acceptCreditAuthorization() {
  return run(
    () =>
      authorizeCredit(
        applicationId.value,
        {
          authorization_version: creditAuthorizationVersion.value,
          document_hash: hashAuthorization(creditAuthorizationVersion.value),
          accepted: true,
        },
        organizationId.value,
      ),
    "Credit authorization accepted.",
  )
}

function snapshotRequirements() {
  return run(
    () => createRequirementSnapshot(applicationId.value, organizationId.value),
    "Requirement snapshot recorded.",
  )
}

onMounted(refresh)
</script>

<template>
  <main class="container">
    <span class="eyebrow">BORROWER PORTAL</span>
    <h2>Complete your application</h2>
    <p class="lede">
      Add the operating details needed for an eligibility review. Sensitive identity
      and banking information are intentionally collected only through approved
      providers.
    </p>

    <div v-if="loading" class="card">
      Loading application…
    </div>
    <div v-else-if="!applicationId" class="card error">
      No borrower application is available for this account.
    </div>

    <template v-else>
      <div v-if="message" class="card notice" role="status">{{ message }}</div>
      <div v-if="error" class="card error" role="alert">{{ error }}</div>

      <section class="card section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">STEP 1</span>
            <h3>Business information</h3>
          </div>
          <span v-if="requirements?.requirements[0]?.complete">Complete</span>
        </div>
        <div class="form-grid">
          <label>
            Legal name
            <input v-model="business.legal_name" required autocomplete="organization" />
          </label>
          <label>
            DBA
            <input v-model="business.dba" autocomplete="organization" />
          </label>
          <label>
            Entity type
            <select v-model="business.entity_type">
              <option :value="null">Select</option>
              <option>LLC</option>
              <option>CORPORATION</option>
              <option>PARTNERSHIP</option>
              <option>SOLE_PROPRIETORSHIP</option>
            </select>
          </label>
          <label>
            State formed
            <input v-model="business.state_formed" maxlength="2" placeholder="FL" />
          </label>
          <label>
            Industry
            <input v-model="business.industry" />
          </label>
          <label>
            Website
            <input v-model="business.website" type="url" autocomplete="url" />
          </label>
        </div>
        <button :disabled="busy || !business.legal_name" @click="saveBusiness">
          Save business
        </button>
      </section>

      <section class="card section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">STEP 2</span>
            <h3>Financial profile</h3>
          </div>
          <span v-if="requirements?.requirements[1]?.complete">Complete</span>
        </div>
        <div class="form-grid">
          <label>
            Annual revenue
            <input v-model.number="financial.annual_revenue" type="number" min="0" />
          </label>
          <label>
            Monthly revenue
            <input v-model.number="financial.monthly_revenue" type="number" min="0" />
          </label>
          <label>
            Monthly expenses
            <input v-model.number="financial.monthly_expenses" type="number" min="0" />
          </label>
          <label>
            Existing debt
            <input v-model.number="financial.existing_debt" type="number" min="0" />
          </label>
          <label>
            Existing positions
            <input
              v-model.number="financial.existing_positions"
              type="number"
              min="0"
            />
          </label>
        </div>
        <button :disabled="busy" @click="saveFinancial">Save financials</button>
      </section>

      <section class="card section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">STEP 3</span>
            <h3>Business owners</h3>
          </div>
          <span v-if="owners.length">{{ owners.length }} added</span>
        </div>

        <div v-for="owner in owners" :key="owner.id" class="owner-row">
          <div>
            <strong>{{ owner.first_name }} {{ owner.last_name }}</strong>
            <small>{{ owner.ownership_percent }}% ownership</small>
          </div>
          <button class="secondary" :disabled="busy" @click="deleteOwner(owner.id)">
            Remove
          </button>
        </div>

        <div class="form-grid">
          <label>
            First name
            <input v-model="newOwner.first_name" autocomplete="given-name" />
          </label>
          <label>
            Last name
            <input v-model="newOwner.last_name" autocomplete="family-name" />
          </label>
          <label>
            Ownership %
            <input
              v-model.number="newOwner.ownership_percent"
              type="number"
              min="0.01"
              max="100"
              step="0.01"
            />
          </label>
          <label>
            Title
            <input v-model="newOwner.title" autocomplete="organization-title" />
          </label>
          <label>
            Email
            <input v-model="newOwner.email" type="email" autocomplete="email" />
          </label>
          <label>
            Phone
            <input v-model="newOwner.phone" type="tel" autocomplete="tel" />
          </label>
        </div>
        <button
          :disabled="busy || !newOwner.first_name || !newOwner.last_name"
          @click="addOwner"
        >
          Add owner
        </button>
      </section>

      <section class="card section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">STEP 4</span>
            <h3>Credit authorization</h3>
          </div>
          <span v-if="creditAuthorizations.length">{{ creditAuthorizations.length }} accepted</span>
        </div>
        <p>
          Confirm authorization before MoneyBee or an approved provider starts any
          credit-related underwriting action.
        </p>
        <div class="form-grid">
          <label class="check-label">
            <input v-model="creditAccepted" type="checkbox" />
            I authorize MoneyBee to use this application for credit review.
          </label>
          <label>
            Authorization version
            <input v-model="creditAuthorizationVersion" maxlength="50" />
          </label>
        </div>
        <button
          :disabled="busy || !creditAccepted || !creditAuthorizationVersion"
          @click="acceptCreditAuthorization"
        >
          Accept authorization
        </button>
        <div v-if="creditAuthorizations.length" class="evidence-list">
          <article v-for="authorization in creditAuthorizations" :key="authorization.id">
            <strong>{{ authorization.authorization_version }}</strong>
            <small>{{ authorization.accepted_by }} · {{ new Date(authorization.accepted_at).toLocaleString() }}</small>
          </article>
        </div>
      </section>

      <section class="card section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">AUDIT</span>
            <h3>Requirement snapshots</h3>
          </div>
          <span v-if="requirementSnapshots.length">{{ requirementSnapshots.length }} recorded</span>
        </div>
        <p>
          Snapshot the application checklist when the file is ready for submission,
          contract, or funding review.
        </p>
        <button :disabled="busy || !requirements" @click="snapshotRequirements">
          Record snapshot
        </button>
        <div v-if="requirementSnapshots.length" class="evidence-list">
          <article v-for="snapshot in requirementSnapshots" :key="snapshot.id">
            <strong>{{ snapshot.completion_percentage }}% complete</strong>
            <small>
              Policy {{ snapshot.policy_version }} ·
              {{ new Date(snapshot.created_at).toLocaleString() }}
            </small>
          </article>
        </div>
      </section>

      <section class="card submit-card">
        <div>
          <span class="eyebrow">REVIEW</span>
          <h3>{{ requirements?.completion_percentage ?? 0 }}% complete</h3>
          <p v-if="!requirements?.ready_to_submit">
            Complete every required section before submitting.
          </p>
          <p v-else>Your application is ready for lender matching.</p>
        </div>
        <button
          :disabled="busy || !requirements?.ready_to_submit"
          @click="submitApplication"
        >
          Submit application
        </button>
      </section>
    </template>
  </main>
</template>

<style scoped>
.lede {
  max-width: 720px;
  color: var(--muted);
}
.section {
  margin-top: 20px;
}
.section-heading,
.owner-row,
.submit-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
.section-heading h3,
.submit-card h3 {
  margin: 4px 0 0;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  margin: 20px 0;
}
label {
  display: grid;
  gap: 7px;
  font-weight: 700;
}

.check-label {
  grid-template-columns: auto 1fr;
  align-items: center;
}

.check-label input {
  width: auto;
}

.evidence-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.evidence-list article {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: #f8f8f4;
}

.evidence-list small {
  color: var(--muted);
}
input,
select {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d2;
  border-radius: 8px;
  background: white;
  font: inherit;
}
.owner-row {
  padding: 12px 0;
  border-bottom: 1px solid #ecece6;
}
.owner-row small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
}
.submit-card {
  margin-top: 20px;
  border-color: var(--gold);
}
.notice {
  border-color: #80b78a;
  color: #225d2d;
}
button.secondary {
  background: transparent;
  color: var(--ink);
  border: 1px solid #c8c8c0;
}
@media (max-width: 640px) {
  .section-heading,
  .submit-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
