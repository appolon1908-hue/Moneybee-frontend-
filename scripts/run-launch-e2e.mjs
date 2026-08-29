import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { extname, join, resolve } from "node:path"

const marketingBaseUrl = process.env.MONEYBEE_MARKETING_URL || "http://127.0.0.1:4173"
const marketingUrl = new URL(marketingBaseUrl)
const marketingDist = resolve("apps/marketing/dist")
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
}

function run(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      ...options,
    })

    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} failed with ${signal || code}`))
    })
  })
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  let lastError

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ""}`)
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

function startStaticServer() {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", marketingUrl)
    const pathname = decodeURIComponent(requestUrl.pathname)
    const relativePath = pathname === "/" || !extname(pathname) ? "index.html" : pathname.slice(1)
    const candidate = resolve(join(marketingDist, relativePath))
    const filePath = candidate.startsWith(marketingDist) ? candidate : join(marketingDist, "index.html")

    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) {
        throw new Error("Not a file")
      }

      response.writeHead(200, {
        "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      })
      response.end(await readFile(filePath))
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      response.end("Not found")
    }
  })

  return new Promise((resolveServer, reject) => {
    server.on("error", reject)
    server.listen(Number(marketingUrl.port || 80), marketingUrl.hostname, () => resolveServer(server))
  })
}

await run("pnpm --filter @moneybee/marketing build")

let server

try {
  if (!(await isUrlReady(marketingBaseUrl))) {
    server = await startStaticServer()
    await waitForUrl(marketingBaseUrl)
  }

  await run("pnpm e2e:launch:external", {
    env: {
      ...process.env,
      MONEYBEE_E2E_EXTERNAL: "true",
      MONEYBEE_MARKETING_URL: marketingBaseUrl,
    },
  })
} finally {
  if (server) {
    await new Promise((resolveClose) => server.close(resolveClose))
  }
}
