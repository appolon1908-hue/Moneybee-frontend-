# Integration operations

The admin application exposes two read-only recovery surfaces:

- **Lifecycle operations** shows pending MoneyBee outbox events and the number of
  authenticated callbacks in the durable inbox.
- **Integration inbox** lists sanitized callback metadata without exposing raw
  provider payloads.

MoneyBee remains the system of record. Codestra is the middleware/control plane,
and Odoo Community is a CRM projection. The UI cannot enable providers, replay
messages, change authoritative application status, or bypass backend capability
and provider-readiness checks.

