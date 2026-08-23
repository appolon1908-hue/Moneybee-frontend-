# Production readiness UI

The admin System page consumes GET /api/v2/admin/system/readiness and displays
machine-reported blockers, release evidence, backup/restore/staging status,
integration queue health, and operational exception count.

The interface is evidence-only. It cannot turn PARTIAL into READY, fabricate
release evidence, activate providers, or bypass backend capability checks.

Operational exceptions are available as a separate read-only queue. Resolution
requires the protected backend action and is always audited.

