import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const clientRoot = join(root, "packages/api-client/src")
const backendOpenApiPath =
  process.env.MONEYBEE_OPENAPI_FILE
  || process.env.API_SCHEMA_FILE
  || resolve(root, "../Moneybee-Backend/openapi.json")

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(path)
    }
  }
  return files
}

const files = await sourceFiles(clientRoot)
const sources = new Map(
  await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")])),
)
const combined = [...sources.values()].join("\n")

const forbidden = [
  "/portal/tasks",
  "/portal/notifications",
  "/portal/conversations",
  "/lender/bank-analysis-queue",
  "/decision`",
]

const required = [
  "/borrower/tasks",
  "/borrower/notifications",
  "/borrower/conversations",
  "/lender/bank-review-queue",
  "/decisions`",
  "/lender/workspace",
  "/lender/portfolio",
  "/admin/workspace",
  "/finance/accounts",
  "/finance/periods",
  "/finance/journal-entries",
  "/finance/trial-balance",
  "/public/prequalifications",
  "/public/contact-requests",
  "/public/callback-requests",
  "/public/lender-partner-inquiries",
  "/public/referral-partner-inquiries",
  "/public/deal-submission-inquiries",
]

const failures = []
for (const route of forbidden) {
  for (const [file, source] of sources) {
    if (source.includes(route)) failures.push(`forbidden route ${route} in ${relative(root, file)}`)
  }
}
for (const route of required) {
  if (!combined.includes(route)) failures.push(`required route missing: ${route}`)
}

function canonical(path) {
  const withoutQuery = path
    .split("${query")[0]
    .split("?")[0]
  const normalized = withoutQuery
    .replace(/\$\{encodeURIComponent\([^)]*\)\}/g, "{}")
    .replace(/\$\{[^}]+\}/g, "{}")
    .replace(/\{[^}]+\}/g, "{}")
    .replace(/\/$/, "")
  return normalized || "/"
}

function frontendRoutes() {
  const routes = new Set()
  const patterns = [
    /api(?:Response)?<[^>]+>\(\s*["`]([^"`$]+)["`]/g,
    /api(?:Response)?\(\s*["`]([^"`$]+)["`]/g,
    /submit<[^>]+>\(\s*["`]([^"`$]+)["`]/g,
    /api(?:Response)?<[^>]+>\(\s*`([^`]+)`/g,
    /api(?:Response)?\(\s*`([^`]+)`/g,
    /:\s*["`]([^"`$]+)["`]/g,
    /=>\s*`([^`]+)`/g,
  ]
  for (const pattern of patterns) {
    for (const match of combined.matchAll(pattern)) {
      const route = canonical(match[1])
      if (route.startsWith("/")) routes.add(route)
    }
  }
  return routes
}

async function backendRoutes(schema, openApiPath) {
  const parsed = JSON.parse(schema)
  const paths = parsed && typeof parsed === "object" && parsed.paths
    ? Object.keys(parsed.paths)
    : []
  const routes = new Set(
    paths
      .filter((path) => path.startsWith("/api/v2/"))
      .map((path) => canonical(path.slice("/api/v2".length))),
  )

  const manifestRoot = join(dirname(openApiPath), "docs/openapi")
  if (!existsSync(manifestRoot)) return routes

  const manifestFiles = await readdir(manifestRoot)
  for (const manifestFile of manifestFiles) {
    if (!manifestFile.endsWith("-manifest.json")) continue
    const manifestPath = join(manifestRoot, manifestFile)
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    for (const path of Object.keys(manifest.paths || {})) {
      if (path.startsWith("/api/v2/")) routes.add(canonical(path.slice("/api/v2".length)))
    }
  }
  return routes
}

if (!existsSync(backendOpenApiPath)) {
  failures.push(
    `backend OpenAPI file missing: ${backendOpenApiPath}. Run python scripts/export_openapi.py in Moneybee-Backend or set MONEYBEE_OPENAPI_FILE.`,
  )
} else {
  const backend = await backendRoutes(await readFile(backendOpenApiPath, "utf8"), backendOpenApiPath)
  const frontend = frontendRoutes()
  const missing = [...frontend].filter((route) => !backend.has(route)).sort()
  if (frontend.size === 0) failures.push("no frontend API routes were detected")
  if (backend.size === 0) failures.push("no backend OpenAPI /api/v2 routes were detected")
  for (const route of missing) failures.push(`frontend route missing from backend OpenAPI: ${route}`)
  console.log(
    `OpenAPI drift check: ${frontend.size} frontend routes against ${backend.size} backend routes`,
  )
}

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`API contracts verified: ${required.length} canonical routes, ${forbidden.length} legacy patterns absent`)
