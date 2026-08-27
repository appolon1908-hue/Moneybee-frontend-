import { api } from "./core"

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
export type PostingSide = "DEBIT" | "CREDIT"

export interface LedgerAccount {
  id: string
  organization_id: string
  code: string
  name: string
  account_type: AccountType
  currency: string
  active: boolean
  system_managed: boolean
}

export interface AccountingPeriod {
  id: string
  organization_id: string
  name: string
  starts_at: string
  ends_at: string
  status: "OPEN" | "CLOSED" | "LOCKED"
  closed_at: string | null
  closed_by: string | null
}

export interface JournalPostingInput {
  account_id: string
  side: PostingSide
  amount: string | number
  application_id?: string
  funding_id?: string
  commission_id?: string
  bank_transaction_id?: string
  memo?: string
  metadata_payload?: Record<string, unknown>
}

export interface JournalEntryInput {
  organization_id?: string
  idempotency_key: string
  source_type: string
  source_id?: string
  description: string
  currency?: string
  effective_at: string
  metadata_payload?: Record<string, unknown>
  postings: JournalPostingInput[]
}

export interface JournalEntry {
  id: string
  organization_id: string
  period_id: string | null
  entry_number: string
  idempotency_key: string
  source_type: string
  source_id: string | null
  description: string
  currency: string
  effective_at: string
  status: "POSTED" | "VOID"
  posted_at: string
  posted_by: string
  reversal_of_id: string | null
}

export interface TrialBalanceLine {
  account_id: string
  code: string
  name: string
  account_type: AccountType
  debit_total: string
  credit_total: string
  balance: string
}

export interface TrialBalance {
  organization_id: string
  currency: string
  as_of: string
  debit_total: string
  credit_total: string
  balanced: boolean
  accounts: TrialBalanceLine[]
}

function query(organizationId?: string): string {
  return organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : ""
}

export const financeApi = {
  accounts(organizationId?: string): Promise<LedgerAccount[]> {
    return api(`/finance/accounts${query(organizationId)}`)
  },

  createAccount(input: {
    organization_id?: string
    code: string
    name: string
    account_type: AccountType
    currency?: string
  }): Promise<LedgerAccount> {
    return api("/finance/accounts", { method: "POST", body: JSON.stringify(input) })
  },

  periods(organizationId?: string): Promise<AccountingPeriod[]> {
    return api(`/finance/periods${query(organizationId)}`)
  },

  createPeriod(input: {
    organization_id?: string
    name: string
    starts_at: string
    ends_at: string
  }): Promise<AccountingPeriod> {
    return api("/finance/periods", { method: "POST", body: JSON.stringify(input) })
  },

  closePeriod(periodId: string): Promise<AccountingPeriod> {
    return api(`/finance/periods/${periodId}/close`, { method: "POST" })
  },

  journalEntries(organizationId?: string): Promise<JournalEntry[]> {
    return api(`/finance/journal-entries${query(organizationId)}`)
  },

  postJournal(input: JournalEntryInput): Promise<JournalEntry> {
    return api("/finance/journal-entries", {
      method: "POST",
      body: JSON.stringify(input),
      idempotencyKey: input.idempotency_key,
    })
  },

  trialBalance(organizationId?: string): Promise<TrialBalance> {
    return api(`/finance/trial-balance${query(organizationId)}`)
  },
}
