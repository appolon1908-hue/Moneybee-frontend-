from __future__ import annotations

import json
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def write(relative_path: str, content: str) -> None:
    target = ROOT / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")


def write_api_client() -> None:
    write(
        "packages/api-client/src/compliance.ts",
        '''
        import { api, type ApiOptions } from "./core"
        import { ENDPOINTS } from "./endpoints"

        export interface ComplianceSummary {
          adverse_action_notices_total: number
          adverse_action_notices_delivered: number
          commercial_financing_disclosures_total: number
          commercial_financing_disclosures_acknowledged: number
          commission_tax_records_total: number
          commission_tax_records_requiring_1099: number
          commission_tax_records_with_tin: number
        }

        export interface CompliancePage<T> {
          items: T[]
          total: number
          limit: number
          offset: number
          has_more: boolean
        }

        export interface AdverseActionNotice {
          id: string
          application_id: string
          submission_id: string
          underwriting_review_id: string
          lender_id: string
          creditor_name: string
          principal_reasons: unknown[]
          notice_text: string
          status: string
          delivered_at: string | null
          created_at: string
        }

        export interface CommercialFinancingDisclosure {
          id: string
          offer_id: string
          application_id: string
          jurisdiction: string | null
          amount_financed: string
          finance_charge: string
          total_repayment_amount: string
          estimated_apr: string | null
          payment_amount: string
          payment_frequency: string
          term_months: number
          prepayment_policy: string
          disclosure_text: string
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
        }

        export interface CommissionTaxRecord {
          id: string
          recipient_type: string
          recipient_reference: string
          recipient_name: string | null
          tax_year: number
          total_amount: string
          commission_count: number
          requires_1099: boolean
          filed_at: string | null
          filing_reference: string | null
          has_tin: boolean
        }

        export interface PageQuery {
          limit?: number
          offset?: number
        }

        export interface AdverseActionNoticeQuery extends PageQuery {
          application_id?: string
          lender_id?: string
          status?: string
        }

        export interface CommercialFinancingDisclosureQuery extends PageQuery {
          application_id?: string
          jurisdiction?: string
          acknowledged?: boolean
        }

        export interface CommissionTaxRecordQuery extends PageQuery {
          tax_year?: number
          requires_1099?: boolean
          has_tin?: boolean
        }

        export interface CommissionTaxRecordTinInput {
          recipient_name: string
          tin: string
        }

        function withOrganization(
          organizationId?: string | null,
          options: ApiOptions = {},
        ): ApiOptions {
          if (!organizationId) return options
          return {
            ...options,
            headers: {
              ...Object.fromEntries(new Headers(options.headers).entries()),
              "X-Organization-ID": organizationId,
            },
          }
        }

        function queryString<T extends object>(values: T): string {
          const params = new URLSearchParams()
          for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
            if (value === undefined || value === null || value === "") continue
            params.set(key, String(value))
          }
          const encoded = params.toString()
          return encoded ? `?${encoded}` : ""
        }

        export function getComplianceSummary(
          organizationId?: string | null,
        ): Promise<ComplianceSummary> {
          return api<ComplianceSummary>(
            ENDPOINTS.compliance.summary,
            withOrganization(organizationId),
          )
        }

        export function listAdverseActionNotices(
          query: AdverseActionNoticeQuery = {},
          organizationId?: string | null,
        ): Promise<CompliancePage<AdverseActionNotice>> {
          return api<CompliancePage<AdverseActionNotice>>(
            `${ENDPOINTS.compliance.adverseActionNotices}${queryString(query)}`,
            withOrganization(organizationId),
          )
        }

        export function listCommercialFinancingDisclosures(
          query: CommercialFinancingDisclosureQuery = {},
          organizationId?: string | null,
        ): Promise<CompliancePage<CommercialFinancingDisclosure>> {
          return api<CompliancePage<CommercialFinancingDisclosure>>(
            `${ENDPOINTS.compliance.commercialFinancingDisclosures}${queryString(query)}`,
            withOrganization(organizationId),
          )
        }

        export function listCommissionTaxRecords(
          query: CommissionTaxRecordQuery = {},
          organizationId?: string | null,
        ): Promise<CompliancePage<CommissionTaxRecord>> {
          return api<CompliancePage<CommissionTaxRecord>>(
            `${ENDPOINTS.compliance.commissionTaxRecords}${queryString(query)}`,
            withOrganization(organizationId),
          )
        }

        export function getCommercialFinancingDisclosure(
          offerId: string,
          organizationId?: string | null,
        ): Promise<CommercialFinancingDisclosure> {
          return api<CommercialFinancingDisclosure>(
            ENDPOINTS.compliance.commercialFinancingDisclosure(offerId),
            withOrganization(organizationId),
          )
        }

        export function acknowledgeCommercialFinancingDisclosure(
          offerId: string,
          organizationId?: string | null,
        ): Promise<CommercialFinancingDisclosure> {
          return api<CommercialFinancingDisclosure>(
            ENDPOINTS.compliance.acknowledgeCommercialFinancingDisclosure(offerId),
            withOrganization(organizationId, { method: "POST" }),
          )
        }

        export function generateCommissionTaxRecords(
          taxYear: number,
          organizationId?: string | null,
        ): Promise<Omit<CommissionTaxRecord, "has_tin">[]> {
          return api<Omit<CommissionTaxRecord, "has_tin">[]>(
            `${ENDPOINTS.compliance.generateCommissionTaxRecords}${queryString({ tax_year: taxYear })}`,
            withOrganization(organizationId, {
              method: "POST",
              idempotencyKey: crypto.randomUUID(),
            }),
          )
        }

        export function setCommissionTaxRecordTin(
          recordId: string,
          payload: CommissionTaxRecordTinInput,
          organizationId?: string | null,
        ): Promise<Omit<CommissionTaxRecord, "has_tin">> {
          return api<Omit<CommissionTaxRecord, "has_tin">>(
            ENDPOINTS.compliance.commissionTaxRecordTin(recordId),
            withOrganization(organizationId, {
              method: "PATCH",
              body: JSON.stringify(payload),
            }),
          )
        }

        export function listApplicationAdverseActionNotices(
          applicationId: string,
          organizationId?: string | null,
        ): Promise<AdverseActionNotice[]> {
          return api<AdverseActionNotice[]>(
            ENDPOINTS.compliance.applicationAdverseActionNotices(applicationId),
            withOrganization(organizationId),
          )
        }
        ''',
    )

    endpoints_path = ROOT / "packages" / "api-client" / "src" / "endpoints.ts"
    endpoints = endpoints_path.read_text(encoding="utf-8")
    if "  compliance: {" not in endpoints:
        marker = "export const ENDPOINTS = {\n"
        block = '''  compliance: {
            summary: "/admin/compliance/summary",
            adverseActionNotices: "/admin/compliance/adverse-action-notices",
            commercialFinancingDisclosures:
              "/admin/compliance/commercial-financing-disclosures",
            commissionTaxRecords: "/admin/compliance/commission-tax-records",
            commercialFinancingDisclosure: (offerId: string) =>
              `/admin/offers/${encodeURIComponent(offerId)}/commercial-financing-disclosure`,
            acknowledgeCommercialFinancingDisclosure: (offerId: string) =>
              `/admin/offers/${encodeURIComponent(offerId)}/commercial-financing-disclosure/acknowledge`,
            generateCommissionTaxRecords: "/admin/commission-tax-records/generate",
            commissionTaxRecordTin: (recordId: string) =>
              `/admin/commission-tax-records/${encodeURIComponent(recordId)}/tin`,
            applicationAdverseActionNotices: (applicationId: string) =>
              `/admin/applications/${encodeURIComponent(applicationId)}/adverse-action-notices`,
          },
        '''
        if marker not in endpoints:
            raise RuntimeError("ENDPOINTS object declaration was not found")
        endpoints = endpoints.replace(marker, marker + textwrap.dedent(block), 1)
        endpoints_path.write_text(endpoints, encoding="utf-8")

    index_path = ROOT / "packages" / "api-client" / "src" / "index.ts"
    index_source = index_path.read_text(encoding="utf-8")
    if 'export * from "./compliance"' not in index_source:
        index_source += ("" if index_source.endswith("\n") else "\n")
        index_source += 'export * from "./compliance"\n'
        index_path.write_text(index_source, encoding="utf-8")

    write(
        "packages/api-client/src/compliance.test.ts",
        '''
        import { describe, expect, it } from "vitest"

        import { ENDPOINTS } from "./endpoints"

        describe("MoneyBee compliance endpoint contract", () => {
          it("uses canonical aggregate operations paths", () => {
            expect(ENDPOINTS.compliance.summary).toBe("/admin/compliance/summary")
            expect(ENDPOINTS.compliance.adverseActionNotices).toBe(
              "/admin/compliance/adverse-action-notices",
            )
            expect(ENDPOINTS.compliance.commercialFinancingDisclosures).toBe(
              "/admin/compliance/commercial-financing-disclosures",
            )
            expect(ENDPOINTS.compliance.commissionTaxRecords).toBe(
              "/admin/compliance/commission-tax-records",
            )
          })

          it("encodes identifiers in detail operations", () => {
            const unsafe = "offer/with space"
            expect(
              ENDPOINTS.compliance.commercialFinancingDisclosure(unsafe),
            ).toContain("offer%2Fwith%20space")
            expect(
              ENDPOINTS.compliance.acknowledgeCommercialFinancingDisclosure(unsafe),
            ).toContain("offer%2Fwith%20space")
          })
        })
        ''',
    )


def write_admin_experience() -> None:
    write(
        "apps/admin/src/views/ComplianceView.vue",
        '''
        <script setup lang="ts">
        import { computed, inject, onMounted, ref } from "vue"
        import {
          ACTIVE_ORGANIZATION_KEY,
          AUTH_MANAGER,
          type LocalPrincipal,
        } from "@moneybee/auth"
        import {
          acknowledgeCommercialFinancingDisclosure,
          generateCommissionTaxRecords,
          getComplianceSummary,
          listAdverseActionNotices,
          listCommercialFinancingDisclosures,
          listCommissionTaxRecords,
          type AdverseActionNotice,
          type CommercialFinancingDisclosure,
          type CommissionTaxRecord,
          type CompliancePage,
          type ComplianceSummary,
        } from "@moneybee/api-client"

        const auth = inject(AUTH_MANAGER)
        const principal = ref<LocalPrincipal | null>(null)
        const summary = ref<ComplianceSummary | null>(null)
        const notices = ref<AdverseActionNotice[]>([])
        const disclosures = ref<CommercialFinancingDisclosure[]>([])
        const taxRecords = ref<CommissionTaxRecord[]>([])
        const loading = ref(true)
        const refreshing = ref(false)
        const error = ref("")
        const actionId = ref("")
        const taxYear = ref(new Date().getUTCFullYear())
        const pendingDisclosuresOnly = ref(false)

        const organizationId = computed<string | null>(
          () =>
            principal.value?.active_organization_id ||
            window.sessionStorage.getItem(ACTIVE_ORGANIZATION_KEY),
        )
        const canAcknowledge = computed(() =>
          Boolean(
            principal.value?.permissions.includes("*") ||
              principal.value?.permissions.includes("application.edit"),
          ),
        )
        const canManageTax = computed(() =>
          Boolean(
            principal.value?.permissions.includes("*") ||
              principal.value?.permissions.includes("commission.receipt.record"),
          ),
        )

        function describe(caught: unknown): string {
          return caught instanceof Error
            ? caught.message
            : "The compliance workspace could not be loaded."
        }

        function formatDate(value: string | null): string {
          if (!value) return "Not recorded"
          return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(value))
        }

        function formatMoney(value: string): string {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(Number(value))
        }

        function formatApr(value: string | null): string {
          return value === null ? "Not available" : `${Number(value).toFixed(2)}%`
        }

        function emptyTaxPage(): CompliancePage<CommissionTaxRecord> {
          return { items: [], total: 0, limit: 50, offset: 0, has_more: false }
        }

        async function load(background = false): Promise<void> {
          if (background) refreshing.value = true
          else loading.value = true
          error.value = ""
          try {
            const taxRequest = canManageTax.value
              ? listCommissionTaxRecords(
                  { tax_year: taxYear.value, limit: 50, offset: 0 },
                  organizationId.value,
                )
              : Promise.resolve(emptyTaxPage())
            const [nextSummary, noticePage, disclosurePage, taxPage] =
              await Promise.all([
                getComplianceSummary(organizationId.value),
                listAdverseActionNotices(
                  { limit: 50, offset: 0 },
                  organizationId.value,
                ),
                listCommercialFinancingDisclosures(
                  {
                    acknowledged: pendingDisclosuresOnly.value ? false : undefined,
                    limit: 50,
                    offset: 0,
                  },
                  organizationId.value,
                ),
                taxRequest,
              ])
            summary.value = nextSummary
            notices.value = noticePage.items
            disclosures.value = disclosurePage.items
            taxRecords.value = taxPage.items
          } catch (caught) {
            error.value = describe(caught)
          } finally {
            loading.value = false
            refreshing.value = false
          }
        }

        async function acknowledge(
          disclosure: CommercialFinancingDisclosure,
        ): Promise<void> {
          if (
            !window.confirm(
              "Record your authenticated account as the acknowledgement actor?",
            )
          ) {
            return
          }
          actionId.value = disclosure.id
          error.value = ""
          try {
            await acknowledgeCommercialFinancingDisclosure(
              disclosure.offer_id,
              organizationId.value,
            )
            await load(true)
          } catch (caught) {
            error.value = describe(caught)
          } finally {
            actionId.value = ""
          }
        }

        async function recomputeTaxRecords(): Promise<void> {
          if (
            !window.confirm(
              `Recompute commission tax records for ${taxYear.value} from authoritative commission data?`,
            )
          ) {
            return
          }
          actionId.value = "tax-generation"
          error.value = ""
          try {
            await generateCommissionTaxRecords(taxYear.value, organizationId.value)
            await load(true)
          } catch (caught) {
            error.value = describe(caught)
          } finally {
            actionId.value = ""
          }
        }

        onMounted(async () => {
          try {
            principal.value = (await auth?.getLocalPrincipal()) || null
          } catch (caught) {
            error.value = describe(caught)
          }
          await load()
        })
        </script>

        <template>
          <section class="ops-screen" aria-labelledby="compliance-title">
            <header class="page-header ops-header">
              <div>
                <p class="eyebrow">Governance</p>
                <h1 id="compliance-title">Compliance operations</h1>
                <p class="lede">
                  Review financing disclosures, adverse-action notices, and
                  commission tax evidence from one authoritative workspace.
                </p>
              </div>
              <button
                class="secondary"
                type="button"
                :disabled="refreshing"
                @click="load(true)"
              >
                {{ refreshing ? "Refreshing…" : "Refresh records" }}
              </button>
            </header>

            <div v-if="loading" class="summary-grid" aria-label="Loading compliance data">
              <div v-for="index in 4" :key="index" class="card skeleton-card" />
            </div>

            <div v-else-if="error && !summary" class="card state-panel" role="alert">
              <p class="eyebrow">Unable to load</p>
              <h2>Compliance data is unavailable</h2>
              <p>{{ error }}</p>
              <button type="button" @click="load()">Try again</button>
            </div>

            <template v-else>
              <div v-if="error" class="inline-alert" role="alert">
                <span>{{ error }}</span>
                <button class="text-button" type="button" @click="error = ''">
                  Dismiss
                </button>
              </div>

              <div v-if="summary" class="summary-grid">
                <article class="card metric-card">
                  <span>Adverse-action notices</span>
                  <strong>{{ summary.adverse_action_notices_total }}</strong>
                  <small>{{ summary.adverse_action_notices_delivered }} delivered</small>
                </article>
                <article class="card metric-card">
                  <span>Financing disclosures</span>
                  <strong>{{ summary.commercial_financing_disclosures_total }}</strong>
                  <small>
                    {{ summary.commercial_financing_disclosures_acknowledged }} acknowledged
                  </small>
                </article>
                <article class="card metric-card">
                  <span>1099 review</span>
                  <strong>{{ summary.commission_tax_records_requiring_1099 }}</strong>
                  <small>Recipients meeting the recorded threshold</small>
                </article>
                <article class="card metric-card">
                  <span>TIN evidence</span>
                  <strong>{{ summary.commission_tax_records_with_tin }}</strong>
                  <small>Stored securely; never displayed</small>
                </article>
              </div>

              <section class="card compliance-section" aria-labelledby="disclosures-heading">
                <div class="section-heading">
                  <div>
                    <p class="eyebrow">Commercial financing</p>
                    <h2 id="disclosures-heading">Cost disclosures</h2>
                  </div>
                  <label class="compact-control">
                    <input
                      v-model="pendingDisclosuresOnly"
                      type="checkbox"
                      @change="load(true)"
                    />
                    Pending acknowledgement only
                  </label>
                </div>
                <div v-if="!disclosures.length" class="empty-state">
                  <h3>No disclosures match this view</h3>
                  <p>Generated disclosures will appear with backend-calculated cost figures.</p>
                </div>
                <div v-else class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Application</th>
                        <th scope="col">Amount financed</th>
                        <th scope="col">Finance charge</th>
                        <th scope="col">Estimated APR</th>
                        <th scope="col">Acknowledgement</th>
                        <th scope="col"><span class="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in disclosures" :key="item.id">
                        <td><code>{{ item.application_id }}</code></td>
                        <td>{{ formatMoney(item.amount_financed) }}</td>
                        <td>{{ formatMoney(item.finance_charge) }}</td>
                        <td>{{ formatApr(item.estimated_apr) }}</td>
                        <td>
                          <span
                            class="status-pill"
                            :class="item.acknowledged_at ? 'status-success' : 'status-warning'"
                          >
                            {{ item.acknowledged_at ? "Acknowledged" : "Pending" }}
                          </span>
                          <small v-if="item.acknowledged_at" class="cell-note">
                            {{ formatDate(item.acknowledged_at) }} · {{ item.acknowledged_by }}
                          </small>
                        </td>
                        <td class="table-action">
                          <button
                            v-if="!item.acknowledged_at && canAcknowledge"
                            type="button"
                            :disabled="actionId === item.id"
                            @click="acknowledge(item)"
                          >
                            {{ actionId === item.id ? "Recording…" : "Acknowledge" }}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="card compliance-section" aria-labelledby="notices-heading">
                <div class="section-heading">
                  <div>
                    <p class="eyebrow">Fair lending</p>
                    <h2 id="notices-heading">Adverse-action notices</h2>
                  </div>
                </div>
                <div v-if="!notices.length" class="empty-state">
                  <h3>No adverse-action notices</h3>
                  <p>Decline decisions that generate a notice will appear here.</p>
                </div>
                <div v-else class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Creditor</th>
                        <th scope="col">Application</th>
                        <th scope="col">Principal reasons</th>
                        <th scope="col">Status</th>
                        <th scope="col">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in notices" :key="item.id">
                        <td>{{ item.creditor_name }}</td>
                        <td><code>{{ item.application_id }}</code></td>
                        <td>{{ item.principal_reasons.join(", ") || "Not recorded" }}</td>
                        <td><span class="status-pill">{{ item.status }}</span></td>
                        <td>{{ formatDate(item.created_at) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="card compliance-section" aria-labelledby="tax-heading">
                <div class="section-heading">
                  <div>
                    <p class="eyebrow">Commission reporting</p>
                    <h2 id="tax-heading">Tax record preparation</h2>
                  </div>
                  <div v-if="canManageTax" class="toolbar compact-toolbar">
                    <label>
                      Tax year
                      <input
                        v-model.number="taxYear"
                        type="number"
                        min="2000"
                        max="2100"
                        @change="load(true)"
                      />
                    </label>
                    <button
                      class="secondary"
                      type="button"
                      :disabled="actionId === 'tax-generation'"
                      @click="recomputeTaxRecords"
                    >
                      {{ actionId === "tax-generation" ? "Recomputing…" : "Recompute year" }}
                    </button>
                  </div>
                </div>
                <p class="muted">
                  This workspace prepares source records only. It never files a tax form.
                </p>
                <div v-if="!canManageTax" class="empty-state">
                  <h3>Tax-record permission required</h3>
                  <p>Your account can review notices and disclosures but cannot access recipient tax data.</p>
                </div>
                <div v-else-if="!taxRecords.length" class="empty-state">
                  <h3>No commission tax records for {{ taxYear }}</h3>
                  <p>Recompute the year after eligible commission activity is recorded.</p>
                </div>
                <div v-else class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Recipient</th>
                        <th scope="col">Type</th>
                        <th scope="col">Total</th>
                        <th scope="col">Commissions</th>
                        <th scope="col">1099 review</th>
                        <th scope="col">TIN evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in taxRecords" :key="item.id">
                        <td>
                          {{ item.recipient_name || item.recipient_reference }}
                          <small v-if="item.recipient_name" class="cell-note">
                            {{ item.recipient_reference }}
                          </small>
                        </td>
                        <td>{{ item.recipient_type }}</td>
                        <td>{{ formatMoney(item.total_amount) }}</td>
                        <td>{{ item.commission_count }}</td>
                        <td>
                          <span
                            class="status-pill"
                            :class="item.requires_1099 ? 'status-warning' : ''"
                          >
                            {{ item.requires_1099 ? "Review required" : "Below threshold" }}
                          </span>
                        </td>
                        <td>
                          <span
                            class="status-pill"
                            :class="item.has_tin ? 'status-success' : 'status-warning'"
                          >
                            {{ item.has_tin ? "On file" : "Missing" }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </template>
          </section>
        </template>
        ''',
    )

    write(
        "apps/admin/src/App.vue",
        '''
        <template>
          <div class="portal">
            <aside class="sidebar">
              <div class="brand"><span class="mark">MB</span> Control Center</div>
              <p class="sidebar-caption">MoneyBee operations and governance</p>
              <nav aria-label="Admin navigation">
                <div class="sidebar-group">
                  <span class="sidebar-label">Overview</span>
                  <RouterLink to="/dashboard">Dashboard</RouterLink>
                  <RouterLink to="/operations-portal">Operations portal</RouterLink>
                </div>
                <div class="sidebar-group">
                  <span class="sidebar-label">Marketplace</span>
                  <RouterLink to="/leads">Leads</RouterLink>
                  <RouterLink to="/applications">Applications</RouterLink>
                  <RouterLink to="/lenders">Lender programs</RouterLink>
                  <RouterLink to="/matches">Matches</RouterLink>
                  <RouterLink to="/submissions">Submissions</RouterLink>
                  <RouterLink to="/offers">Offers</RouterLink>
                  <RouterLink to="/underwriting">Underwriting</RouterLink>
                </div>
                <div class="sidebar-group">
                  <span class="sidebar-label">Finance &amp; compliance</span>
                  <RouterLink to="/finance">Finance</RouterLink>
                  <RouterLink to="/compliance">Compliance</RouterLink>
                </div>
                <div class="sidebar-group">
                  <span class="sidebar-label">Service operations</span>
                  <RouterLink to="/sla-alerts">SLA alerts</RouterLink>
                  <RouterLink to="/users">Users</RouterLink>
                  <RouterLink to="/operations">Lifecycle operations</RouterLink>
                  <RouterLink to="/public-intakes">Public intakes</RouterLink>
                </div>
                <div class="sidebar-group">
                  <span class="sidebar-label">Integrations</span>
                  <RouterLink to="/crm-deliveries">CRM deliveries</RouterLink>
                  <RouterLink to="/integration-inbox">Integration inbox</RouterLink>
                  <RouterLink to="/operational-exceptions">Operational exceptions</RouterLink>
                  <RouterLink to="/crm">CRM &amp; integrations</RouterLink>
                </div>
                <div class="sidebar-group">
                  <span class="sidebar-label">Governance</span>
                  <RouterLink to="/audit">Audit</RouterLink>
                  <RouterLink to="/system">System</RouterLink>
                </div>
              </nav>
            </aside>
            <main class="content"><RouterView /></main>
          </div>
        </template>
        ''',
    )

    router_path = ROOT / "apps" / "admin" / "src" / "router.ts"
    router = router_path.read_text(encoding="utf-8")
    if 'path: "/compliance"' not in router:
        marker = "routes: ["
        route = (
            '\n    { path: "/compliance", component: () => '
            'import("./views/ComplianceView.vue") },'
        )
        if marker not in router:
            raise RuntimeError("Admin route array was not found")
        router = router.replace(marker, marker + route, 1)
        router_path.write_text(router, encoding="utf-8")


def update_styles() -> None:
    path = ROOT / "packages" / "ui" / "src" / "styles.css"
    styles = path.read_text(encoding="utf-8")
    marker = "/* MoneyBee compliance operations */"
    if marker in styles:
        return
    styles += textwrap.dedent(
        '''

        /* MoneyBee compliance operations */
        .sidebar-caption { margin: 12px 0 0; color: #cbd5e1; font-size: .86rem; }
        .sidebar nav { gap: 24px; }
        .sidebar-group { display: grid; gap: 4px; }
        .sidebar-label {
          margin-bottom: 4px; color: #94a3b8; font-size: .72rem;
          font-weight: 900; letter-spacing: .08em; text-transform: uppercase;
        }
        .sidebar-group a { padding: 8px 10px; border-radius: 8px; color: #e2e8f0; }
        .sidebar-group a:hover { background: rgba(255, 255, 255, .08); }
        .sidebar-group a.router-link-active {
          background: rgba(245, 185, 66, .14); color: var(--gold);
        }
        .ops-screen { display: grid; gap: 24px; max-width: 1480px; margin: 0 auto; }
        .ops-header h1 { margin-bottom: 10px; }
        .summary-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;
        }
        .metric-card { min-height: 154px; display: grid; align-content: space-between; gap: 8px; }
        .metric-card > span { color: var(--slate); font-weight: 800; }
        .metric-card > strong { font-size: 2.4rem; line-height: 1; }
        .compliance-section { display: grid; gap: 18px; box-shadow: none; }
        .section-heading {
          display: flex; justify-content: space-between; align-items: end;
          gap: 20px; flex-wrap: wrap;
        }
        .section-heading h2, .section-heading p { margin-bottom: 0; }
        .compact-control {
          display: flex; grid-template-columns: none; align-items: center;
          gap: 10px; min-height: 44px;
        }
        .compact-control input { width: auto; min-height: auto; }
        .compact-toolbar label { min-width: 130px; }
        .compact-toolbar input { width: 130px; }
        .state-panel, .empty-state { text-align: center; padding: 36px; }
        .empty-state { border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; }
        .empty-state h3 { margin-top: 0; }
        .inline-alert {
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; padding: 14px 16px; border: 1px solid #fecaca;
          border-radius: 8px; background: #fff1f2; color: #991b1b;
        }
        .text-button { min-height: 36px; padding: 0 10px; background: transparent; color: inherit; }
        .status-success { background: #dcfce7; color: #166534; }
        .status-warning { background: #fef3c7; color: #92400e; }
        .cell-note { display: block; margin-top: 5px; }
        .table-action { text-align: right; }
        code { font-size: .82rem; overflow-wrap: anywhere; }
        .skeleton-card {
          min-height: 154px; box-shadow: none;
          background: #eef2f7;
          animation: moneybee-skeleton 1.4s ease-in-out infinite alternate;
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        @keyframes moneybee-skeleton { to { opacity: .45; } }
        @media (max-width: 1100px) {
          .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 780px) {
          .summary-grid { grid-template-columns: 1fr; }
          .section-heading { align-items: stretch; flex-direction: column; }
          .compact-toolbar, .compact-toolbar label, .compact-toolbar input { width: 100%; }
          .table-action { text-align: left; }
        }
        ''',
    )
    path.write_text(styles, encoding="utf-8")


def update_contract_checks() -> None:
    path = ROOT / "scripts" / "check-api-contracts.mjs"
    source = path.read_text(encoding="utf-8")
    required = (
        '  "/admin/compliance/summary",\n'
        '  "/admin/compliance/adverse-action-notices",\n'
        '  "/admin/compliance/commercial-financing-disclosures",\n'
        '  "/admin/compliance/commission-tax-records",\n'
    )
    if '"/admin/compliance/summary"' not in source:
        marker = "const required = [\n"
        if marker not in source:
            raise RuntimeError("Required route list was not found")
        source = source.replace(marker, marker + required, 1)
        path.write_text(source, encoding="utf-8")

    ci_path = ROOT / ".github" / "workflows" / "ci.yml"
    ci = ci_path.read_text(encoding="utf-8")
    ci = ci.replace(
        "${{ vars.MONEYBEE_BACKEND_CONTRACT_REF || 'main' }}",
        "${{ vars.MONEYBEE_BACKEND_CONTRACT_REF || 'claude/system-review-architecture-8vo66p' }}",
    )
    ci_path.write_text(ci, encoding="utf-8")


def write_documentation() -> None:
    write(
        "docs/COMPLIANCE_OPERATIONS_UI.md",
        '''
        # MoneyBee compliance operations UI

        The admin application exposes one compliance workspace at `/compliance`.
        It uses the canonical `/api/v2` API and does not calculate authoritative
        financial or legal values in the browser.

        ## Screen hierarchy

        1. Aggregate evidence cards
        2. Commercial-financing disclosures and authenticated acknowledgement
        3. Adverse-action notices
        4. Commission tax-record preparation

        Every collection includes loading, error, and empty states. Mutations are
        permission-aware and require confirmation. Users without the tax-record
        permission can still review notices and disclosures without receiving
        recipient tax data.

        TIN material is never requested by, stored in, or displayed from this
        screen. Only the backend `has_tin` evidence flag is shown.

        `packages/api-client/src/compliance.ts` is the only frontend service
        boundary for these operations. Screen components do not call `fetch`
        directly. The frontend CI checks these routes against the exact backend
        review contract until the backend PR is merged.
        ''',
    )
    write(
        "docs/BACKEND_CONTRACT_LOCK.json",
        json.dumps(
            {
                "repository": "appolon1908-hue/Moneybee-Backend",
                "ref": "claude/system-review-architecture-8vo66p",
                "purpose": "MoneyBee compliance API review contract",
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
    )


def main() -> None:
    write_api_client()
    write_admin_experience()
    update_styles()
    update_contract_checks()
    write_documentation()
    print("MoneyBee compliance UI completion applied.")


if __name__ == "__main__":
    main()
