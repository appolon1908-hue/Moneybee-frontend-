import { api } from "./core";
import { ENDPOINTS } from "./endpoints";

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ComplianceOverview {
  adverse_action_notices: number;
  adverse_action_notices_pending_delivery: number;
  commercial_financing_disclosures: number;
  commercial_financing_disclosures_unacknowledged: number;
  commission_tax_records: number;
  commission_tax_records_requiring_1099: number;
  commission_tax_records_missing_tin: number;
  generated_at: string;
}

export interface AdverseActionNotice {
  id: string;
  application_id: string;
  submission_id: string;
  underwriting_review_id: string;
  lender_id: string;
  creditor_name: string;
  principal_reasons: string[];
  notice_text: string;
  status: string;
  delivered_at: string | null;
  created_at: string;
}

export interface CommercialFinancingDisclosure {
  id: string;
  offer_id: string;
  application_id: string;
  jurisdiction: string | null;
  amount_financed: string;
  finance_charge: string;
  total_repayment_amount: string;
  estimated_apr: string | null;
  payment_amount: string;
  payment_frequency: string;
  term_months: number;
  prepayment_policy: string;
  disclosure_text: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface CommissionTaxRecord {
  id: string;
  recipient_type: string;
  recipient_reference: string;
  recipient_name: string | null;
  tax_year: number;
  total_amount: string;
  commission_count: number;
  requires_1099: boolean;
  tin_present: boolean;
  filed_at: string | null;
  filing_reference: string | null;
}

export interface CompliancePageQuery {
  limit?: number;
  offset?: number;
}

export interface AdverseActionNoticeQuery extends CompliancePageQuery {
  application_id?: string;
  status?: string;
}

export interface CommercialFinancingDisclosureQuery extends CompliancePageQuery {
  application_id?: string;
  acknowledged?: boolean;
}

export interface CommissionTaxRecordQuery extends CompliancePageQuery {
  tax_year?: number;
  requires_1099?: boolean;
  tin_present?: boolean;
}

export interface CommissionTaxRecordTinInput {
  recipient_name: string;
  tin: string;
}

export interface CommissionTaxRecordFilingInput {
  filing_reference: string;
}

function queryString(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function getComplianceOverview(): Promise<ComplianceOverview> {
  return api<ComplianceOverview>(ENDPOINTS.admin.compliance.overview);
}

export function listAdverseActionNotices(
  query: AdverseActionNoticeQuery = {},
): Promise<Page<AdverseActionNotice>> {
  return api<Page<AdverseActionNotice>>(
    `${ENDPOINTS.admin.compliance.adverseActionNotices}${queryString(query)}`,
  );
}

export function listCommercialFinancingDisclosures(
  query: CommercialFinancingDisclosureQuery = {},
): Promise<Page<CommercialFinancingDisclosure>> {
  return api<Page<CommercialFinancingDisclosure>>(
    `${ENDPOINTS.admin.compliance.commercialFinancingDisclosures}${queryString(query)}`,
  );
}

export function listCommissionTaxRecords(
  query: CommissionTaxRecordQuery = {},
): Promise<Page<CommissionTaxRecord>> {
  return api<Page<CommissionTaxRecord>>(
    `${ENDPOINTS.admin.compliance.commissionTaxRecords}${queryString(query)}`,
  );
}

export function generateCommissionTaxRecords(
  taxYear: number,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CommissionTaxRecord[]> {
  return api<CommissionTaxRecord[]>(
    `${ENDPOINTS.admin.compliance.commissionTaxRecordsGenerate}${queryString({ tax_year: taxYear })}`,
    { method: "POST", idempotencyKey },
  );
}

export function setCommissionTaxRecordTin(
  recordId: string,
  payload: CommissionTaxRecordTinInput,
): Promise<CommissionTaxRecord> {
  return api<CommissionTaxRecord>(
    ENDPOINTS.admin.compliance.commissionTaxRecordTin(recordId),
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function recordCommissionTaxFiling(
  recordId: string,
  payload: CommissionTaxRecordFilingInput,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CommissionTaxRecord> {
  return api<CommissionTaxRecord>(
    ENDPOINTS.admin.compliance.commissionTaxRecordFiling(recordId),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      idempotencyKey,
    },
  );
}

export function getBorrowerCommercialFinancingDisclosure(
  offerId: string,
): Promise<CommercialFinancingDisclosure> {
  return api<CommercialFinancingDisclosure>(
    ENDPOINTS.borrower.commercialFinancingDisclosure(offerId),
  );
}

export function acknowledgeBorrowerCommercialFinancingDisclosure(
  offerId: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CommercialFinancingDisclosure> {
  return api<CommercialFinancingDisclosure>(
    ENDPOINTS.borrower.commercialFinancingDisclosureAcknowledge(offerId),
    { method: "POST", idempotencyKey },
  );
}

export function acknowledgeAdminCommercialFinancingDisclosure(
  offerId: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<CommercialFinancingDisclosure> {
  return api<CommercialFinancingDisclosure>(
    ENDPOINTS.admin.compliance.disclosureAcknowledge(offerId),
    { method: "POST", idempotencyKey },
  );
}
