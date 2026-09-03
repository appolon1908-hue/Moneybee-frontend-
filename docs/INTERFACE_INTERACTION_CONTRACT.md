# MoneyBee interface and interaction contract

Updated: 2026-09-01

This contract keeps the four MoneyBee applications visually consistent and prevents presentation code from becoming a second business-logic implementation.

## Visual foundation

The shared UI package is the only location for global product tokens and base controls.

Current semantic tokens include:

- deep navy for primary text, navigation and strong actions;
- honey gold for attention and primary action emphasis;
- teal/green for confirmed or healthy state;
- red for destructive/error state;
- cream/white surfaces with restrained borders and shadows;
- slate for secondary text.

Rules:

- Use semantic variables rather than new screen-specific hex values when an existing token fits.
- One screen should have one obvious primary action.
- Inputs retain visible labels and explanatory/error text.
- Status always includes text; color is supplementary.
- Minimum interactive target is 44 by 44 CSS pixels.
- Keyboard focus must remain visible.
- Tables must remain horizontally usable on small viewports; essential actions cannot become unreachable.
- Avoid decorative gradients, glass effects and excessive elevation in financial/compliance workspaces.

## Information hierarchy

### Borrower

1. current application or funding state;
2. next required action;
3. authoritative amounts/terms;
4. supporting documents and timeline;
5. legal disclosure/consent;
6. help and communication.

### Lender

1. assigned queue and SLA;
2. application evidence;
3. bank/underwriting findings;
4. conditions and decision controls;
5. offer construction;
6. portfolio follow-up.

### Admin

1. work requiring action;
2. commercial state;
3. finance and compliance evidence;
4. integration failures/recovery;
5. audit and readiness.

The admin navigation is grouped according to those responsibilities. Compliance is not placed in the consumer navigation.

## Money and legal text

- Use `money()` or an equivalent shared formatter only for display.
- Display values received from typed API responses; never derive authoritative finance charge, APR, total repayment, commission, tax or ledger balance in a component.
- Do not convert decimal strings through an imprecise arithmetic path to make business decisions.
- Legal/disclosure text is rendered from the backend record without rewriting.
- A disclosure acknowledgment action is separate from offer acceptance.
- A filing-evidence action is separate from transmitting a filing.

## Mutation interaction

Before a state-changing action, the screen must know:

- the target resource;
- the current backend state/version when required;
- the authenticated organization/context;
- whether the action is capability-permitted;
- the idempotency key when required;
- what confirmation language is necessary.

During a mutation:

- disable duplicate submission;
- retain the original idempotency key until the outcome is known;
- show an operation-specific progress label;
- do not navigate away before the response unless the user explicitly cancels a locally cancellable draft action.

After a mutation:

- replace cached data with the authoritative response or invalidate/refetch the exact query;
- show a concise success message that does not overstate external delivery;
- on 409/428, reload current state instead of blind retry;
- on an ambiguous network failure, do not create a new idempotency key automatically.

## Sensitive fields

TIN, account credentials, tokens and other secret material require special handling:

- TIN is entered only in the focused tax-evidence editor.
- The value is submitted to the typed API and immediately cleared from component state after success.
- The API response contains only `tin_present`; the screen never reads a TIN back.
- Browser storage, route query strings, analytics and normal logs must not contain sensitive field values.
- Authentication tokens are managed by the shared auth/client packages, not individual views.

## Accessibility

- Page regions use meaningful headings and landmarks.
- Data table headers identify columns.
- Success and error messages use appropriate live-region roles.
- Form controls have programmatic labels.
- Details/summary controls expose long legal text without forcing it into every table row.
- Confirmation text names the actual effect, especially when an action records evidence but does not deliver, file or move funds.
- Responsive layouts must preserve reading order and not rely on hover.

## Compliance workspace patterns

The compliance workspace uses:

- summary cards only for actionable counts;
- filters adjacent to the collection they control;
- explicit empty-state language;
- status pills with text and semantic color;
- expandable immutable notice/disclosure text;
- confirmation before tax-year record generation;
- a focused editor for sensitive tax evidence;
- separate controls for TIN evidence and external filing-reference evidence;
- persistent statements that no filing or money movement occurs from those controls.

## Review checklist

A MoneyBee screen is ready for review only when:

- it uses the shared API client and canonical endpoint constants;
- all response and request types are explicit;
- loading, empty, error and unavailable states are visible;
- mutations are duplicate-safe;
- permissions/capabilities are not inferred from button visibility;
- money and legal text come from the backend;
- sensitive values cannot be read back or logged;
- keyboard and mobile interaction are usable;
- TypeScript, unit tests, contract drift checks and the application build pass.
