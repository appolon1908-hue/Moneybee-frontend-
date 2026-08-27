import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const scanRoots = ['apps', 'packages']
const allowedExtensions = new Set(['.vue', '.css', '.ts', '.js', '.mjs'])
const tokenFile = 'packages/design-system/src/styles/tokens.css'
const componentRoot = 'packages/design-system/src/components/'
const violations = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(full))
    else files.push(full)
  }
  return files
}

function add(path, rule, detail) {
  violations.push(`${path}: ${rule} — ${detail}`)
}

for (const scanRoot of scanRoots) {
  const files = await walk(join(root, scanRoot))
  for (const file of files) {
    if (!allowedExtensions.has(extname(file))) continue
    const path = relative(root, file).replaceAll('\\', '/')
    const source = await readFile(file, 'utf8')

    if (path !== tokenFile && /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(source)) {
      add(path, 'COLOR_TOKEN_REQUIRED', 'literal colors belong only in tokens.css')
    }

    if (path !== tokenFile && /font-family\s*:/i.test(source)) {
      add(path, 'FONT_TOKEN_REQUIRED', 'font-family is centralized in tokens.css')
    }

    if (/\btransition\s*:\s*all\b/i.test(source)) {
      add(path, 'RESTRAINED_MOTION_REQUIRED', 'transition only the properties that actually change')
    }

    if (/\sstyle\s*=\s*["']/i.test(source)) {
      add(path, 'INLINE_STYLE_DISALLOWED', 'use shared tokens or component classes')
    }

    if (path.endsWith('.vue') && path.startsWith('apps/') && /<button\b/i.test(source)) {
      add(path, 'SHARED_BUTTON_REQUIRED', 'application pages must use MbButton')
    }

    if (path.endsWith('.vue') && path.startsWith('apps/') && /<(header|footer)\b/i.test(source)) {
      add(path, 'SHARED_CHROME_REQUIRED', 'header and footer are owned by MarketingShell')
    }

    if (path.endsWith('.css') && !path.startsWith('packages/design-system/src/styles/')) {
      add(path, 'PARALLEL_CSS_SYSTEM_DISALLOWED', 'global CSS belongs in the design-system package')
    }
  }
}

const appPath = 'apps/marketing/src/App.vue'
const app = await readFile(join(root, appPath), 'utf8')
if (!app.includes('MarketingShell') || !app.includes('<RouterView')) {
  add(appPath, 'MARKETING_SHELL_REQUIRED', 'all marketing routes must render through MarketingShell')
}

const button = await readFile(join(root, `${componentRoot}MbButton.vue`), 'utf8')
if (!button.includes('var(--mb-control-height)')) {
  add(`${componentRoot}MbButton.vue`, 'CONTROL_HEIGHT_REQUIRED', 'primary control height must use the shared token')
}

if (violations.length) {
  console.error('\nMoneyBee design-system guard failed:\n')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('MoneyBee design-system guard passed.')
