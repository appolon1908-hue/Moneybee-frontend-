<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue"
import {
  IdempotencyKeyRegistry,
  acknowledgeAdminCommercialFinancingDisclosure,
  generateCommissionTaxRecords,
  getComplianceOverview,
  listAdverseActionNotices,
  listCommercialFinancingDisclosures,
  listCommissionTaxRecords,
  money,
  recordCommissionTaxFiling,
  setCommissionTaxRecordTin,
  type AdverseActionNotice,
  type CommercialFinancingDisclosure,
  type CommissionTaxRecord,
  type ComplianceOverview,
} from "@moneybee/api-client"
import {
  AUTH_MANAGER,
  hasPermission,
  type LocalPrincipal,
} from "@moneybee/auth"
import {
  emptyPage,
  isCurrentRefresh,
  nextPageOffset,
  pageSummary,
  previousPageOffset,
} from "../compliance-state"

type ComplianceSection = "overview" | "notices" | "disclosures" | "taxRecords"

const auth = inject(AUTH_MANAGER)
const principal = ref<LocalPrincipal | null>(null)
const overview = ref<ComplianceOverview | null>(null)
const noticePage = ref(emptyPage<AdverseActionNotice>(50))
const disclosurePage = ref(emptyPage<CommercialFinancingDisclosure>(50))
const taxPage = ref(emptyPage<CommissionTaxRecord>(100))
const busy = ref(false)
const error = ref("")
const success = ref("")
const taxYear = ref(new Date().getUTCFullYear())
const disclosureState = ref<"all" | "acknowledged" | "unacknowledged">("unacknowledged")
const noticeStatus = ref("")
const selectedTaxRecord = ref<CommissionTaxRecord | null>(null)
const recipientName = ref("")
const tin = ref("")
const filingReference = ref("")
const commandKeys = new IdempotencyKeyRegistry()

const sectionErrors = ref<Record<ComplianceSection, string>>({
  overview: "",
  notices: "",
  disclosures: "",
  taxRecords: "",
})
const sectionLoading = ref<Record<ComplianceSection, boolean>>({
  overview: false,
  notices: false,
  disclosures: false,
  taxRecords: false,
})

let refreshGeneration = 0

const notices = computed(() => noticePage.value.items)
const disclosures = computed(() => disclosurePage.value.items)
const taxRecords = computed(() => taxPage.value.items)
const loading = computed(() => Object.values(sectionLoading.value).some(Boolean))
const canReadCompliance = computed(() => hasPermission(principal.value, "compliance.read"))
const canManageTax = computed(() => Boolean(
  canReadCompliance.value
  && (
    hasPermission(principal.value, "commission.receipt.record")
    || hasPermission(principal.value, "compliance.write")
  ),
))

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : "The request could not be completed."
}

function disclosureAcknowledgedFilter(): boolean | undefined {
  if (disclosureState.value === "acknowledged") return true
  if (disclosureState.value === "unacknowledged") return false
  return undefined
}

function resetSectionState(): void {
  sectionErrors.value = {
    overview: "",
    notices: "",
    disclosures: "",
    taxRecords: "",
  }
  sectionLoading.value = {
    overview: true,
    notices: true,
    disclosures: true,
    taxRecords: true,
  }
}

function settleSection(
  section: ComplianceSection,
  result: PromiseSettledResult<unknown>,
): void {
  sectionLoading.value[section] = false
  if (result.status === "rejected") {
    sectionErrors.value[section] = describe(result.reason)
  }
}

async function refresh(): Promise<void> {
  if (!canReadCompliance.value) return

  const generation = ++refreshGeneration
  resetSectionState()
  error.value = ""

  const noticeQuery = {
    status: noticeStatus.value || undefined,
    limit: noticePage.value.limit,
    offset: noticePage.value.offset,
  }
  const disclosureQuery = {
    acknowledged: disclosureAcknowledgedFilter(),
    limit: disclosurePage.value.limit,
    offset: disclosurePage.value.offset,
  }
  const taxQuery = {
    tax_year: taxYear.value,
    limit: taxPage.value.limit,
    offset: taxPage.value.offset,
  }

  const [
    summaryResult,
    noticeResult,
    disclosureResult,
    taxResult,
  ] = await Promise.allSettled([
    getComplianceOverview(),
    listAdverseActionNotices(noticeQuery),
    listCommercialFinancingDisclosures(disclosureQuery),
    listCommissionTaxRecords(taxQuery),
  ])

  if (!isCurrentRefresh(generation, refreshGeneration)) return

  if (summaryResult.status === "fulfilled") overview.value = summaryResult.value
  if (noticeResult.status === "fulfilled") noticePage.value = noticeResult.value
  if (disclosureResult.status === "fulfilled") disclosurePage.value = disclosureResult.value
  if (taxResult.status === "fulfilled") taxPage.value = taxResult.value

  settleSection("overview", summaryResult)
  settleSection("notices", noticeResult)
  settleSection("disclosures", disclosureResult)
  settleSection("taxRecords", taxResult)
}

function resetDisclosureFilter(): void {
  disclosurePage.value = {
    ...disclosurePage.value,
    offset: 0,
  }
  void refresh()
}

function resetNoticeFilter(): void {
  noticePage.value = {
    ...noticePage.value,
    offset: 0,
  }
  void refresh()
}

function resetTaxYear(): void {
  taxPage.value = {
    ...taxPage.value,
    offset: 0,
  }
  void refresh()
}

function previousDisclosurePage(): void {
  disclosurePage.value = {
    ...disclosurePage.value,
    offset: previousPageOffset(disclosurePage.value),
  }
  void refresh()
}

function nextDisclosurePage(): void {
  disclosurePage.value = {
    ...disclosurePage.value,
    offset: nextPageOffset(disclosurePage.value),
  }
  void refresh()
}

function previousNoticePage(): void {
  noticePage.value = {
    ...noticePage.value,
    offset: previousPageOffset(noticePage.value),
  }
  void refresh()
}

function nextNoticePage(): void {
  noticePage.value = {
    ...noticePage.value,
    offset: nextPageOffset(noticePage.value),
  }
  void refresh()
}

function previousTaxPage(): void {
  taxPage.value = {
    ...taxPage.value,
    offset: previousPageOffset(taxPage.value),
  }
  void refresh()
}

function nextTaxPage(): void {
  taxPage.value = {
    ...taxPage.value,
    offset: nextPageOffset(taxPage.value),
  }
  void refresh()
}

function recordMutationFailure(operation: string, caught: unknown): void {
  commandKeys.recordFailure(operation, caught)
  error.value = describe(caught)
}

async function acknowledge(disclosure: CommercialFinancingDisclosure): Promise<void> {
  const operation = `admin-disclosure-acknowledge:${disclosure.id}`
  busy.value = true
  error.value = ""
  success.value = ""
  try {
    await acknowledgeAdminCommercialFinancingDisclosure(
      disclosure.offer_id,
      commandKeys.forOperation(operation),
    )
    commandKeys.resolve(operation)
    success.value = "The disclosure acknowledgment was recorded under your authenticated account."
    await refresh()
  } catch (caught) {
    recordMutationFailure(operation, caught)
  } finally {
    busy.value = false
  }
}

async function generateTaxRecords(): Promise<void> {
  if (!window.confirm(`Generate or refresh ${taxYear.value} commission tax records? This records data only and does not file with a tax authority.`)) return

  const operation = `generate-commission-tax-records:${taxYear.value}`
  busy.value = true
  error.value = ""
  success.value = ""
  try {
    await generateCommissionTaxRecords(
      taxYear.value,
      commandKeys.forOperation(operation),
    )
    commandKeys.resolve(operation)
    success.value = `${taxYear.value} commission tax records were recalculated. No filing was transmitted.`
    await refresh()
  } catch (caught) {
    recordMutationFailure(operation, caught)
  } finally {
    busy.value = false
  }
}

function editTaxRecord(record: CommissionTaxRecord): void {
  selectedTaxRecord.value = record
  recipientName.value = record.recipient_name || ""
  tin.value = ""
  filingReference.value = record.filing_reference || ""
}

function closeTaxEditor(): void {
  selectedTaxRecord.value = null
  recipientName.value = ""
  tin.value = ""
  filingReference.value = ""
}

async function saveTin(): Promise<void> {
  if (!selectedTaxRecord.value || !recipientName.value.trim() || !tin.value.trim()) return

  busy.value = true
  error.value = ""
  success.value = ""
  try {
    await setCommissionTaxRecordTin(selectedTaxRecord.value.id, {
      recipient_name: recipientName.value.trim(),
      tin: tin.value.trim(),
    })
    tin.value = ""
    success.value = "The taxpayer identifier was encrypted and stored. It is not displayed or returned by the API."
    await refresh()
  } catch (caught) {
    error.value = describe(caught)
  } finally {
    busy.value = false
  }
}

async function saveFiling(): Promise<void> {
  if (!selectedTaxRecord.value || !filingReference.value.trim()) return

  const operation = `record-commission-tax-filing:${selectedTaxRecord.value.id}`
  busy.value = true
  error.value = ""
  success.value = ""
  try {
    await recordCommissionTaxFiling(
      selectedTaxRecord.value.id,
      { filing_reference: filingReference.value.trim() },
      commandKeys.forOperation(operation),
    )
    commandKeys.resolve(operation)
    success.value = "Filing evidence was recorded. MoneyBee did not transmit a tax filing."
    closeTaxEditor()
    await refresh()
  } catch (caught) {
    recordMutationFailure(operation, caught)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    principal.value = await auth?.getLocalPrincipal() || null
  } catch (caught) {
    error.value = describe(caught)
    return
  }

  if (!canReadCompliance.value) {
    error.value = "You do not have permission to view compliance records."
    return
  }

  await refresh()
})
</script>

<template>
  <main class="container compliance-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">CONTROL CENTER · COMPLIANCE</span>
        <h2>Compliance records</h2>
        <p class="lede">
          Review adverse-action notices, commercial-financing disclosures, and commission tax evidence from one auditable workspace.
        </p>
      </div>
      <button class="secondary" :disabled="loading || busy || !canReadCompliance" @click="refresh">
        {{ loading ? "Refreshing…" : "Refresh records" }}
      </button>
    </header>

    <div v-if="success" class="notice" role="status">{{ success }}</div>
    <div v-if="error" class="error-banner" role="alert">{{ error }}</div>

    <section v-if="sectionLoading.overview && !overview" class="grid three" aria-label="Loading compliance summary">
      <div v-for="index in 3" :key="index" class="card skeleton-card" />
    </section>
    <div v-else-if="sectionErrors.overview && !overview" class="section-error" role="alert">
      <span>Compliance summary unavailable: {{ sectionErrors.overview }}</span>
      <button class="secondary" @click="refresh">Retry summary</button>
    </div>
    <section v-else-if="overview" class="summary-grid" aria-label="Compliance summary">
      <article class="card summary-card attention">
        <span>Unacknowledged disclosures</span>
        <strong>{{ overview.commercial_financing_disclosures_unacknowledged }}</strong>
        <small>Offers awaiting recorded acknowledgment</small>
      </article>
      <article class="card summary-card attention">
        <span>Notices pending delivery</span>
        <strong>{{ overview.adverse_action_notices_pending_delivery }}</strong>
        <small>Generated records without delivery evidence</small>
      </article>
      <article class="card summary-card attention">
        <span>1099 records missing TIN</span>
        <strong>{{ overview.commission_tax_records_missing_tin }}</strong>
        <small>Sensitive identifiers are write-only and encrypted</small>
      </article>
      <article class="card summary-card">
        <span>Total compliance records</span>
        <strong>{{
          overview.adverse_action_notices
          + overview.commercial_financing_disclosures
          + overview.commission_tax_records
        }}</strong>
        <small>Last refreshed {{ new Date(overview.generated_at).toLocaleString() }}</small>
      </article>
    </section>
    <div v-if="sectionErrors.overview && overview" class="section-error compact" role="alert">
      <span>Showing the last successful summary. Refresh failed: {{ sectionErrors.overview }}</span>
      <button class="secondary" @click="refresh">Retry</button>
    </div>

    <section class="card section" :aria-busy="sectionLoading.disclosures">
      <div class="section-heading">
        <div>
          <span class="eyebrow">COMMERCIAL FINANCING</span>
          <h3>Disclosures</h3>
          <p class="muted">Amounts and terms come directly from the backend’s immutable offer disclosure record.</p>
        </div>
        <label class="compact-field">Acknowledgment
          <select v-model="disclosureState" @change="resetDisclosureFilter">
            <option value="unacknowledged">Action required</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All records</option>
          </select>
        </label>
      </div>

      <div v-if="sectionErrors.disclosures" class="section-error" role="alert">
        <span>Disclosures could not be refreshed: {{ sectionErrors.disclosures }}</span>
        <button class="secondary" @click="refresh">Retry disclosures</button>
      </div>
      <div v-if="sectionLoading.disclosures && disclosures.length === 0" class="empty-state">
        <strong>Loading disclosures…</strong>
      </div>
      <div v-else-if="!sectionErrors.disclosures && disclosures.length === 0" class="empty-state">
        <strong>No disclosures match this filter.</strong>
        <span>Try another acknowledgment state or refresh the records.</span>
      </div>
      <div v-if="disclosures.length" class="table-wrap">
        <table>
          <thead>
            <tr><th>Application</th><th>Financing</th><th>Payment</th><th>Status</th><th>Record</th><th /></tr>
          </thead>
          <tbody>
            <tr v-for="item in disclosures" :key="item.id">
              <td><code>{{ item.application_id }}</code><small>{{ item.jurisdiction || "Jurisdiction not set" }}</small></td>
              <td><strong>{{ money(item.amount_financed) }}</strong><small>Total repayment {{ money(item.total_repayment_amount) }}</small></td>
              <td>{{ money(item.payment_amount) }} {{ item.payment_frequency.toLowerCase() }}<small>{{ item.term_months }} months · {{ item.estimated_apr ? `${item.estimated_apr}% est. APR` : "APR unavailable" }}</small></td>
              <td><span class="status-pill" :class="item.acknowledged_at ? 'status-ok' : 'status-warning'">{{ item.acknowledged_at ? "Acknowledged" : "Action required" }}</span><small v-if="item.acknowledged_by">By {{ item.acknowledged_by }}</small></td>
              <td><details><summary>View disclosure</summary><pre>{{ item.disclosure_text }}</pre></details></td>
              <td><button v-if="!item.acknowledged_at" :disabled="busy" @click="acknowledge(item)">Record acknowledgment</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="disclosurePage.total > disclosurePage.limit || disclosurePage.offset > 0" class="pagination" aria-label="Disclosure pages">
        <button class="secondary" :disabled="loading || disclosurePage.offset === 0" @click="previousDisclosurePage">Previous</button>
        <span>{{ pageSummary(disclosurePage) }}</span>
        <button class="secondary" :disabled="loading || !disclosurePage.has_more" @click="nextDisclosurePage">Next</button>
      </div>
    </section>

    <section class="card section" :aria-busy="sectionLoading.notices">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ECOA / REGULATION B</span>
          <h3>Adverse-action notices</h3>
          <p class="muted">Generated decision notices remain visible with their principal reasons and delivery evidence state.</p>
        </div>
        <label class="compact-field">Status
          <select v-model="noticeStatus" @change="resetNoticeFilter">
            <option value="">All statuses</option>
            <option value="GENERATED">Generated</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>
      </div>

      <div v-if="sectionErrors.notices" class="section-error" role="alert">
        <span>Adverse-action notices could not be refreshed: {{ sectionErrors.notices }}</span>
        <button class="secondary" @click="refresh">Retry notices</button>
      </div>
      <div v-if="sectionLoading.notices && notices.length === 0" class="empty-state">
        <strong>Loading adverse-action notices…</strong>
      </div>
      <div v-else-if="!sectionErrors.notices && notices.length === 0" class="empty-state">
        <strong>No adverse-action notices match this filter.</strong>
        <span>Generated notices will appear here after a lender decline decision.</span>
      </div>
      <div v-if="notices.length" class="table-wrap">
        <table>
          <thead><tr><th>Application</th><th>Creditor</th><th>Principal reasons</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            <tr v-for="item in notices" :key="item.id">
              <td><code>{{ item.application_id }}</code></td>
              <td>{{ item.creditor_name }}</td>
              <td><ul><li v-for="reason in item.principal_reasons" :key="reason">{{ reason }}</li></ul><details><summary>View notice text</summary><pre>{{ item.notice_text }}</pre></details></td>
              <td><span class="status-pill" :class="item.delivered_at ? 'status-ok' : 'status-warning'">{{ item.status }}</span><small>{{ item.delivered_at ? new Date(item.delivered_at).toLocaleString() : "No delivery evidence" }}</small></td>
              <td>{{ new Date(item.created_at).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="noticePage.total > noticePage.limit || noticePage.offset > 0" class="pagination" aria-label="Adverse-action notice pages">
        <button class="secondary" :disabled="loading || noticePage.offset === 0" @click="previousNoticePage">Previous</button>
        <span>{{ pageSummary(noticePage) }}</span>
        <button class="secondary" :disabled="loading || !noticePage.has_more" @click="nextNoticePage">Next</button>
      </div>
    </section>

    <section class="card section" :aria-busy="sectionLoading.taxRecords">
      <div class="section-heading">
        <div>
          <span class="eyebrow">COMMISSION TAX EVIDENCE</span>
          <h3>Commission tax records</h3>
          <p class="muted">MoneyBee prepares filing evidence only. This workspace cannot transmit a tax filing or move funds.</p>
        </div>
        <div class="toolbar">
          <label class="compact-field">Tax year<input v-model.number="taxYear" type="number" min="2000" max="2100" @change="resetTaxYear" /></label>
          <button v-if="canManageTax" :disabled="busy" @click="generateTaxRecords">Generate records</button>
        </div>
      </div>

      <div v-if="sectionErrors.taxRecords" class="section-error" role="alert">
        <span>Commission tax records could not be refreshed: {{ sectionErrors.taxRecords }}</span>
        <button class="secondary" @click="refresh">Retry tax records</button>
      </div>
      <div v-if="sectionLoading.taxRecords && taxRecords.length === 0" class="empty-state">
        <strong>Loading commission tax records…</strong>
      </div>
      <div v-else-if="!sectionErrors.taxRecords && taxRecords.length === 0" class="empty-state">
        <strong>No commission tax records exist for {{ taxYear }}.</strong>
        <span>Generate records after commission splits have been recorded for this year.</span>
      </div>
      <div v-if="taxRecords.length" class="table-wrap">
        <table>
          <thead><tr><th>Recipient</th><th>Total</th><th>1099</th><th>TIN</th><th>Filing evidence</th><th /></tr></thead>
          <tbody>
            <tr v-for="item in taxRecords" :key="item.id">
              <td><strong>{{ item.recipient_name || "Name required" }}</strong><small>{{ item.recipient_type }} · {{ item.recipient_reference }}</small></td>
              <td><strong>{{ money(item.total_amount) }}</strong><small>{{ item.commission_count }} commission records</small></td>
              <td><span class="status-pill" :class="item.requires_1099 ? 'status-warning' : 'status-ok'">{{ item.requires_1099 ? "Required" : "Not required" }}</span></td>
              <td><span class="status-pill" :class="item.tin_present ? 'status-ok' : 'status-warning'">{{ item.tin_present ? "Stored securely" : "Missing" }}</span></td>
              <td><span class="status-pill" :class="item.filed_at ? 'status-ok' : ''">{{ item.filed_at ? "Recorded" : "Not recorded" }}</span><small>{{ item.filing_reference || "No reference" }}</small></td>
              <td><button v-if="canManageTax" class="secondary" @click="editTaxRecord(item)">Manage evidence</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="taxPage.total > taxPage.limit || taxPage.offset > 0" class="pagination" aria-label="Commission tax record pages">
        <button class="secondary" :disabled="loading || taxPage.offset === 0" @click="previousTaxPage">Previous</button>
        <span>{{ pageSummary(taxPage) }}</span>
        <button class="secondary" :disabled="loading || !taxPage.has_more" @click="nextTaxPage">Next</button>
      </div>
    </section>

    <section v-if="selectedTaxRecord" class="card tax-editor" aria-labelledby="tax-editor-title">
      <div class="section-heading">
        <div><span class="eyebrow">SECURE TAX EVIDENCE</span><h3 id="tax-editor-title">Manage {{ selectedTaxRecord.recipient_reference }}</h3></div>
        <button class="secondary" @click="closeTaxEditor">Close</button>
      </div>
      <p class="muted">The taxpayer identifier is sent once to the encrypted backend field. It is never read back into this screen.</p>
      <div class="form-grid">
        <label>Recipient legal name<input v-model="recipientName" maxlength="255" autocomplete="organization" /></label>
        <label>Taxpayer identifier<input v-model="tin" maxlength="20" autocomplete="off" inputmode="numeric" placeholder="Enter securely" /></label>
      </div>
      <button :disabled="busy || !recipientName.trim() || !tin.trim()" @click="saveTin">Encrypt and save TIN</button>
      <hr />
      <label>External filing reference<input v-model="filingReference" maxlength="255" placeholder="Reference from approved filing process" /></label>
      <button class="secondary" :disabled="busy || !filingReference.trim()" @click="saveFiling">Record filing evidence</button>
    </section>
  </main>
</template>

<style scoped>
.compliance-page { display: grid; gap: 24px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.summary-card { display: grid; gap: 8px; box-shadow: none; }
.summary-card strong { font-size: 2rem; }
.summary-card.attention { border-top: 4px solid var(--gold); }
.summary-card small, td small { display: block; margin-top: 6px; color: var(--slate); }
.section { padding: 24px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.section-heading h3 { margin: 5px 0; }
.compact-field { min-width: 180px; }
.notice, .error-banner, .section-error { border-radius: 8px; padding: 14px 16px; font-weight: 700; }
.notice { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; }
.error-banner, .section-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.section-error { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.section-error.compact { margin: 0; }
.empty-state { display: grid; gap: 6px; padding: 28px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; }
.status-ok { background: #dcfce7; color: #166534; }
.status-warning { background: #fef3c7; color: #92400e; }
td code { font-size: .78rem; overflow-wrap: anywhere; }
td ul { margin: 0; padding-left: 18px; }
details { max-width: 420px; }
summary { cursor: pointer; font-weight: 700; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; color: var(--navy); }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 16px; }
.pagination span { min-width: 120px; text-align: center; font-weight: 700; }
.tax-editor { position: sticky; bottom: 18px; z-index: 4; border-top: 5px solid var(--teal); }
.tax-editor hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
.skeleton-card { min-height: 140px; background: linear-gradient(90deg, #f8fafc, #eef2f7, #f8fafc); background-size: 200% 100%; animation: loading 1.3s infinite; }
@keyframes loading { to { background-position: -200% 0; } }
@media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) {
  .summary-grid { grid-template-columns: 1fr; }
  .section-heading, .section-error { align-items: stretch; flex-direction: column; }
  .pagination { justify-content: space-between; }
  .tax-editor { position: static; }
}
</style>
