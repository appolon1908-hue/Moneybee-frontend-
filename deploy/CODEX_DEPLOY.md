# MoneyBee production deployment runbook for Codex

Target host: `49.12.145.107`

This runbook deploys MoneyBee behind the server's existing Caddy edge. It does **not** enable external financial/provider capabilities. Keep all lender submission, credit, e-sign, bank-provider, CRM/Odoo, middleware delivery, email and SMS providers disabled unless a separate reviewed activation explicitly enables them.

## Required public hostnames

- `moneybeeloan.com` -> marketing
- `www.moneybeeloan.com` -> redirect to apex
- `app.moneybeeloan.com` -> borrower portal
- `lenders.moneybeeloan.com` -> lender portal
- `lender.moneybeeloan.com` -> compatibility redirect only
- `admin.moneybeeloan.com` -> admin portal
- `api.moneybeeloan.com` -> FastAPI backend
- Identity remains `https://auth.codestra.co/realms/codestra`; do not create `auth.moneybeeloan.com`.

## Hard deployment gates

Do not cut traffic over unless all of these are true:

1. Frontend PR checks are green on the exact frontend SHA to be deployed.
2. Backend PR checks are green on the exact backend SHA to be deployed.
3. `auth.codestra.co` completes a valid TLS handshake and its Keycloak realm/JWKS endpoints are reachable. A 502 is a release blocker for authenticated portals.
4. DNS for every required MoneyBee hostname resolves to `49.12.145.107`.
5. Existing Caddy configuration is backed up before modification.
6. PostgreSQL backup is created before applying migrations if a MoneyBee database already exists.
7. Every MoneyBee container is healthy on the private Docker networks before Caddy is reloaded.
8. Caddy configuration validates successfully before reload.

If any gate fails, stop and report the exact blocker. Do not force the deployment.

## Expected server layout

```text
/opt/moneybee/
  backend/                 # Moneybee-Backend checkout
  frontend/                # Moneybee-frontend- checkout
  secrets/
    postgres.env           # mode 0600, never committed
    backend.env            # mode 0600, never committed
  release.env              # release identifier only, no secrets
```

The Compose file lives at:

```text
/opt/moneybee/frontend/deploy/docker-compose.production.yml
```

It expects the backend checkout at `/opt/moneybee/backend` and the frontend checkout at `/opt/moneybee/frontend`.

## 1. Inspect without changing the live edge

```bash
set -euo pipefail

hostname
uname -a
docker version
docker compose version
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

for host in moneybeeloan.com www.moneybeeloan.com app.moneybeeloan.com lenders.moneybeeloan.com admin.moneybeeloan.com api.moneybeeloan.com auth.codestra.co; do
  echo "=== $host ==="
  getent ahostsv4 "$host" | head || true
done

ss -lntp | grep -E ':(80|443)\b' || true
```

Confirm ports 80/443 remain owned by the existing edge and not by a MoneyBee application container.

## 2. Resolve and record exact release SHAs

Use the exact reviewed SHAs, not moving branch names, for the deployment record.

```bash
FRONTEND_SHA='<reviewed frontend SHA>'
BACKEND_SHA='<reviewed backend SHA>'
printf 'FRONTEND_SHA=%s\nBACKEND_SHA=%s\n' "$FRONTEND_SHA" "$BACKEND_SHA"
```

Before continuing, verify GitHub CI for those exact SHAs is green. If not, stop.

## 3. Prepare checkouts

```bash
sudo install -d -m 0755 /opt/moneybee
sudo install -d -m 0700 /opt/moneybee/secrets
sudo chown -R "$USER":"$USER" /opt/moneybee

cd /opt/moneybee

if [ ! -d frontend/.git ]; then
  git clone https://github.com/appolon1908-hue/Moneybee-frontend-.git frontend
fi
if [ ! -d backend/.git ]; then
  git clone https://github.com/appolon1908-hue/Moneybee-Backend.git backend
fi

git -C frontend fetch --all --prune
git -C backend fetch --all --prune

git -C frontend checkout --detach "$FRONTEND_SHA"
git -C backend checkout --detach "$BACKEND_SHA"

git -C frontend status --short
git -C backend status --short
```

Both working trees must be clean.

## 4. Create release and secret files

Create `/opt/moneybee/release.env`:

```bash
cat > /opt/moneybee/release.env <<EOF
MONEYBEE_RELEASE=${FRONTEND_SHA:0:12}-${BACKEND_SHA:0:12}
EOF
chmod 0644 /opt/moneybee/release.env
```

Generate one strong PostgreSQL password. Do not print it into logs after generation.

```bash
POSTGRES_PASSWORD="$(openssl rand -base64 48 | tr -d '\n')"
```

Create `/opt/moneybee/secrets/postgres.env`:

```bash
cat > /opt/moneybee/secrets/postgres.env <<EOF
POSTGRES_DB=moneybee
POSTGRES_USER=moneybee
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
EOF
chmod 0600 /opt/moneybee/secrets/postgres.env
```

Create `/opt/moneybee/secrets/backend.env` from the backend production template, then replace the database password and fill only secrets that are required for currently enabled capabilities:

```bash
cp /opt/moneybee/backend/.env.production.example /opt/moneybee/secrets/backend.env
python3 - <<'PY'
from pathlib import Path
import os
p = Path('/opt/moneybee/secrets/backend.env')
s = p.read_text()
s = s.replace(
    'DATABASE_URL=postgresql+asyncpg://moneybee:CHANGE_ME@postgres:5432/moneybee',
    'DATABASE_URL=postgresql+asyncpg://moneybee:' + os.environ['POSTGRES_PASSWORD'] + '@postgres:5432/moneybee',
)
p.write_text(s)
PY
chmod 0600 /opt/moneybee/secrets/backend.env
unset POSTGRES_PASSWORD
```

Confirm these safety values remain present in `backend.env`:

```text
APP_ENV=production
AUTO_CREATE_SCHEMA=false
LOCAL_AUTH_BYPASS=false
LOCAL_IDENTITY_ENFORCEMENT=true
MIDDLEWARE_PROVIDER=disabled
ENABLE_EXTERNAL_DELIVERY=false
LIVE_WRITES=false
ODOO_WRITE=false
N8N_DELIVERY_ENABLED=false
BANK_PROVIDER=disabled
CRM_PROVIDER=disabled
KYB_PROVIDER=disabled
CREDIT_PROVIDER=disabled
LENDER_PROVIDER=disabled
ESIGN_PROVIDER=disabled
EMAIL_PROVIDER=disabled
SMS_PROVIDER=disabled
OBJECT_STORAGE_MODE=disabled
```

Do not commit `/opt/moneybee/secrets/*`.

## 5. Validate identity before deploying authenticated portals

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' \
  https://auth.codestra.co/realms/codestra/.well-known/openid-configuration
curl -fsS \
  https://auth.codestra.co/realms/codestra/protocol/openid-connect/certs \
  >/dev/null
```

If either fails, stop. Repair the existing `auth.codestra.co` 502 before production cutover.

## 6. Create private/edge networks

```bash
docker network inspect moneybee-edge >/dev/null 2>&1 || docker network create moneybee-edge
```

`moneybee-internal` is created by Compose and is marked internal. PostgreSQL and Redis have no host port mappings.

## 7. Validate Compose before starting services

```bash
cd /opt/moneybee/frontend

docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  config >/tmp/moneybee-compose.rendered.yml
```

Inspect `/tmp/moneybee-compose.rendered.yml`. It must contain no public `ports:` mappings for PostgreSQL, Redis, API or frontend services.

## 8. Start PostgreSQL and Redis only

```bash
docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  up -d postgres redis

docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  ps
```

Wait for both services to report healthy.

If a prior MoneyBee PostgreSQL volume already exists, take and verify a backup before migrations.

## 9. Build API and run migrations before starting the API

```bash
docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  build api

docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  run --rm api alembic upgrade head
```

If the migration command fails, do not start application services and do not modify Caddy.

## 10. Build and start all MoneyBee services

```bash
docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  build marketing borrower lender admin

docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  up -d api marketing borrower lender admin

docker compose \
  --env-file /opt/moneybee/release.env \
  -f deploy/docker-compose.production.yml \
  ps
```

All five application services must report healthy.

## 11. Test upstreams without changing public Caddy routes

Run temporary curl containers on the edge network:

```bash
for target in \
  http://moneybee-marketing/ \
  http://moneybee-borrower/ \
  http://moneybee-lender/ \
  http://moneybee-admin/ \
  http://moneybee-api:8000/health/live \
  http://moneybee-api:8000/health/ready; do
  echo "=== $target ==="
  docker run --rm --network moneybee-edge curlimages/curl:8.12.1 -fsS "$target" >/dev/null
 done
```

Do not continue if any upstream fails.

## 12. Attach the existing Caddy container to the MoneyBee edge network

Discover the actual Caddy container instead of assuming its name:

```bash
CADDY_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' | awk 'tolower($0) ~ /caddy/ {print $1; exit}')"
test -n "$CADDY_CONTAINER"
echo "Caddy container: $CADDY_CONTAINER"

docker inspect "$CADDY_CONTAINER" > /tmp/moneybee-caddy-before.json

docker network inspect moneybee-edge --format '{{json .Containers}}' | grep -q "$(docker inspect -f '{{.Id}}' "$CADDY_CONTAINER")" \
  || docker network connect moneybee-edge "$CADDY_CONTAINER"
```

## 13. Back up and update Caddy configuration

First discover the active Caddyfile and host bind mount from `docker inspect "$CADDY_CONTAINER"`. Do not overwrite an unknown path.

Make a timestamped backup of the host-side active Caddy configuration before editing it.

Preferred pattern: keep the MoneyBee block in a separate host file and import it from the active Caddyfile:

```text
import /etc/caddy/sites/*.caddy
```

Copy `/opt/moneybee/frontend/deploy/Caddyfile.moneybee` into the corresponding host-mounted `sites` directory. If the existing Caddy setup does not use imports, append the contents to the active host Caddyfile only after making a backup.

Validate inside the existing Caddy container before reload:

```bash
docker exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile
```

If validation fails, restore the backup and stop.

Then reload without restarting the whole edge:

```bash
docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
```

## 14. Verify TLS and public routing

```bash
for host in moneybeeloan.com www.moneybeeloan.com app.moneybeeloan.com lenders.moneybeeloan.com admin.moneybeeloan.com api.moneybeeloan.com; do
  echo "=== $host ==="
  echo | openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null | openssl x509 -noout -subject -issuer -dates
 done

curl -fsSI https://moneybeeloan.com/
curl -fsSI https://app.moneybeeloan.com/
curl -fsSI https://lenders.moneybeeloan.com/
curl -fsSI https://admin.moneybeeloan.com/
curl -fsS https://api.moneybeeloan.com/health/live
curl -fsS https://api.moneybeeloan.com/health/ready
```

`www.moneybeeloan.com` should redirect to the apex. `lender.moneybeeloan.com`, if its DNS record remains, should redirect to `lenders.moneybeeloan.com`.

## 15. Application smoke tests

Verify in a browser or controlled HTTP client:

1. Marketing site renders.
2. Borrower, lender and admin portals load their SPA shells.
3. Login redirects to `auth.codestra.co` with Authorization Code + PKCE.
4. Successful login returns to the correct MoneyBee portal.
5. `/api/v2/auth/context` resolves the user and active organization.
6. Authenticated requests contain `Authorization: Bearer ...` and `X-Organization-ID`.
7. Admin overview, task, search, organization, integration and finance read paths work.
8. Finance trial balance is read-only unless the principal has finance permissions.
9. No external provider is activated by smoke testing.

Do not perform a real lender submission, credit pull, e-sign send, money transfer, email/SMS send, Odoo write or live provider call during this deployment.

## 16. Post-deployment evidence

Record:

- exact frontend SHA
- exact backend SHA
- rendered Compose checksum
- migration head
- Caddy configuration checksum
- certificate subjects/expiry dates
- container image IDs
- container health status
- API `/health/live` and `/health/ready` results
- auth discovery/JWKS results
- timestamp of Caddy reload

## 17. Rollback

If public routing fails after Caddy reload:

1. Restore the timestamped Caddy backup.
2. Validate the restored configuration.
3. Reload Caddy.
4. Confirm all pre-existing sites work.
5. Leave MoneyBee containers running privately for diagnosis or stop only the MoneyBee project:

```bash
docker compose \
  --env-file /opt/moneybee/release.env \
  -f /opt/moneybee/frontend/deploy/docker-compose.production.yml \
  down
```

Do not delete PostgreSQL/Redis volumes during rollback.

If a database migration must be rolled back, first determine the exact prior Alembic revision and confirm the migration is reversible. Never run `alembic downgrade base` on production.
