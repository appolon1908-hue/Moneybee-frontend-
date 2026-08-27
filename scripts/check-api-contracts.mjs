import { readdir, readFile } from "node:fs/promises"
import { join, relative } from "node:path"

const root = new URL("../", import.meta.url).pathname
const clientRoot = join(root, "packages/api-client/src")

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(path)
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

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`API contracts verified: ${required.length} canonical routes, ${forbidden.length} legacy patterns absent`)
