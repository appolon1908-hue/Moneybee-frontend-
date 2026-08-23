import { spawnSync } from 'node:child_process'
const source = process.env.OPENAPI_SOURCE
if (!source) {
  console.error('OPENAPI_SOURCE is required; generation is intentionally not faked in bootstrap.')
  process.exit(2)
}
const result = spawnSync('pnpm', ['exec', 'openapi-typescript', source, '-o', 'packages/generated-api/src/schema.d.ts'], { stdio: 'inherit' })
process.exit(result.status ?? 1)
