# Phase 14 — i18n (All 6 Languages + VAT Logic)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Complete all 6 locale files, wire next-intl throughout the entire app, implement VAT logic per country.

## Step 0 — Version Check
```bash
npm info next-intl version
```
Search: "next-intl latest usage App Router 2026" to confirm current API patterns.

## Step 1 — Complete All Locale Files
Fill in ALL strings for all 6 locales. Every UI string that exists in the app must have a translation.

Structure (expand `en.json` first to have all keys, then translate):
- `nav.*` — navigation items
- `common.*` — shared (save, cancel, delete, loading, error)
- `auth.*` — login, signup, reset password strings
- `onboarding.*` — all 9 step titles, descriptions, button labels
- `overview.*` — page title, card labels, digest prefix
- `communications.*` — filter labels, status labels, AI panel labels
- `finance.*` — KPI labels, invoice statuses, expense categories
- `planning.*` — day names, shift labels, time-off strings
- `team.*` — role names, access level names, status labels
- `settings.*` — all tab and field labels
- `notifications.*` — all notification message templates

For translations: use accurate professional translations (not Google Translate verbatim — use natural business language for each locale).

## Step 2 — Wire next-intl into App Router
Update `app/layout.tsx` and `middleware.ts` to use next-intl routing.
URL structure: `/fr/overview`, `/de/finance`, etc. — locale prefix in URL.
Default locale (EN) can optionally be prefix-free.

Update all internal `<Link>` components to use `useRouter` from next-intl.

## Step 3 — Replace Hardcoded Strings
Go through EVERY component and replace hardcoded strings with `useTranslations()` calls.
Priority order: nav, auth pages, onboarding, overview, then remaining modules.

## Step 4 — Locale-Aware Formatting
Create `lib/utils/locale.ts`:
```typescript
import { format } from 'date-fns'
import { fr, de, es, it, nl, enGB } from 'date-fns/locale'

const dateLocales: Record<string, Locale> = { fr, de, es, it, nl, en: enGB }

export function formatDate(date: Date, locale: string, formatStr = 'dd MMM yyyy') {
  return format(date, formatStr, { locale: dateLocales[locale] || enGB })
}

export function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
```

Use `formatDate` and `formatCurrency` everywhere dates and money are displayed.

## Step 5 — VAT Logic
`lib/utils/vat.ts` should already exist from Phase 08. Verify it has all EU countries.
Wire VAT rate into:
- Invoice creation form (auto-populate from business country)
- VAT summary panel in Finance
- Invoice total calculation

## Step 6 — Language Switcher in Settings
Verify Settings → Account tab language selector correctly:
- Updates `users.locale` in Supabase
- Reloads the page with new locale prefix
- Persists across sessions

## Step 7 — Verify
1. Switch app to French → all strings in French
2. Switch to German → all strings in German
3. Dates formatted correctly per locale (German: "29. März 2026", French: "29 mars 2026")
4. Currency formatted correctly (French: "12 480,00 €", German: "12.480,00 €")
5. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-14 complete — i18n all 6 locales, locale-aware dates/currency, VAT per country"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**