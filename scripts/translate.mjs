#!/usr/bin/env node
/**
 * Auto-translate messages/en.json → messages/{locale}.json
 * Uses the free Google Translate public endpoint — no API key, no cost.
 * Translates only MISSING keys so existing human-edited strings are preserved.
 *
 * Usage:  node scripts/translate.mjs
 *         node scripts/translate.mjs --force   (re-translate everything)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MESSAGES = join(ROOT, 'messages')

const LOCALES = ['fr', 'de', 'es', 'it', 'nl']
const FORCE = process.argv.includes('--force')

// Free Google Translate endpoint — same one Chrome's built-in translator uses.
async function translateText(text, targetLang) {
  // Skip strings that are purely symbols / numbers / punctuation / proper nouns
  if (!text || /^[\d\s\W]+$/.test(text)) return text

  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'en')
  url.searchParams.set('tl', targetLang)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!res.ok) throw new Error(`Translate API error: ${res.status}`)
  const data = await res.json()

  // Response: [[["translated","original",null,null,...],...],null,"en"]
  const translated = data[0]?.map((chunk) => chunk[0]).join('') ?? text

  // Preserve {placeholder} tokens — Google sometimes translates them
  // Restore any {word} that was mangled back to the original token
  return restorePlaceholders(text, translated)
}

function restorePlaceholders(original, translated) {
  const tokens = [...original.matchAll(/\{(\w+)\}/g)].map((m) => m[0])
  let result = translated
  // Re-insert any placeholder that got dropped or mangled
  for (const token of tokens) {
    if (!result.includes(token)) {
      // Try to find a mangled version like { name } → {name}
      const mangled = new RegExp(`\\{\\s*${token.slice(1, -1)}\\s*\\}`, 'gi')
      result = result.replace(mangled, token)
    }
  }
  return result
}

// Flatten nested object to { 'a.b.c': 'value' }
function flatten(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null) {
      Object.assign(out, flatten(v, key))
    } else {
      out[key] = v
    }
  }
  return out
}

// Unflatten { 'a.b': 'v' } back to { a: { b: 'v' } }
function unflatten(flat) {
  const out = {}
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.')
    let cur = out
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {}
      cur = cur[parts[i]]
    }
    cur[parts.at(-1)] = val
  }
  return out
}

async function translateLocale(locale) {
  const sourcePath = join(MESSAGES, 'en.json')
  const targetPath = join(MESSAGES, `${locale}.json`)

  const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
  const existing = existsSync(targetPath)
    ? JSON.parse(readFileSync(targetPath, 'utf8'))
    : {}

  const flatSource = flatten(source)
  const flatExisting = flatten(existing)

  const missing = FORCE
    ? flatSource
    : Object.fromEntries(
        Object.entries(flatSource).filter(([k]) => !(k in flatExisting))
      )

  const missingCount = Object.keys(missing).length
  if (missingCount === 0) {
    console.log(`[${locale}] ✓ All keys present, nothing to do.`)
    return
  }

  console.log(`[${locale}] Translating ${missingCount} key(s)...`)

  const translated = { ...flatExisting }
  let done = 0

  for (const [key, val] of Object.entries(missing)) {
    try {
      translated[key] = await translateText(val, locale)
      done++
      // Small delay to be polite to the free API
      await new Promise((r) => setTimeout(r, 80))
      process.stdout.write(`\r[${locale}] ${done}/${missingCount}`)
    } catch (err) {
      console.error(`\n[${locale}] Failed to translate "${key}": ${err.message}`)
      translated[key] = val // keep English as fallback
    }
  }

  // Sort keys to match the source structure ordering
  const ordered = {}
  for (const key of Object.keys(flatSource)) {
    ordered[key] = translated[key] ?? flatSource[key]
  }

  writeFileSync(targetPath, JSON.stringify(unflatten(ordered), null, 2) + '\n', 'utf8')
  console.log(`\n[${locale}] ✓ Written to messages/${locale}.json`)
}

console.log('📝 Omnexia auto-translate\n')
console.log('Source: messages/en.json')
console.log(`Target locales: ${LOCALES.join(', ')}\n`)
if (FORCE) console.log('⚠️  --force: re-translating all keys\n')

for (const locale of LOCALES) {
  await translateLocale(locale)
}

console.log('\n✅ Done. Review the JSON files before committing.')
console.log('   Tip: Run with --force to re-translate everything.')
