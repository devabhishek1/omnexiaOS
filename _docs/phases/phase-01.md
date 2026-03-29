# Phase 01 — Repo Scaffold + Supabase Setup
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Scaffold the entire Next.js project structure and configure Supabase from scratch. No UI yet — just the skeleton everything else will be built on.

## Step 0 — Search For Latest Versions First
Before installing anything, run these commands in the terminal to get current versions:
```bash
npm info next version
npm info @supabase/supabase-js version
npm info @supabase/ssr version
npm info tailwindcss version
npm info next-intl version
npm info typescript version
npm info zod version
npm info react-hook-form version
npm info date-fns version
npm info lucide-react version
npm info @dnd-kit/core version
npm info recharts version
npm info resend version
```
Use ONLY the versions returned. Never assume.

## Step 1 — Initialise Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```
When prompted: yes to all defaults.

## Step 2 — Install All Dependencies
Install in one command using the versions found in Step 0:
```bash
npm install @supabase/supabase-js @supabase/ssr next-intl zod react-hook-form @hookform/resolvers date-fns lucide-react recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities resend @google/generative-ai googleapis
```

Install dev dependencies:
```bash
npm install -D @types/node supabase
```

## Step 3 — Install shadcn/ui
```bash
npx shadcn@latest init
```
When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then install these components:
```bash
npx shadcn@latest add button input label card badge avatar tabs select dialog dropdown-menu toast sonner separator skeleton
```

## Step 4 — Create Folder Structure
Create all these folders (add .gitkeep in each so git tracks them):
```
app/(auth)/login/
app/(auth)/signup/
app/(auth)/reset-password/
app/(onboarding)/onboarding/
app/(onboarding)/onboarding/steps/
app/(dashboard)/overview/
app/(dashboard)/communications/
app/(dashboard)/communications/[id]/
app/(dashboard)/finance/
app/(dashboard)/planning/
app/(dashboard)/team/
app/(dashboard)/team/[employeeId]/
app/(dashboard)/settings/
app/api/auth/callback/google/
app/api/gmail/
app/api/webhooks/
components/ui/
components/layout/
components/overview/
components/communications/
components/finance/
components/planning/
components/team/
components/settings/
lib/supabase/
lib/gmail/
lib/gemini/
lib/resend/
lib/utils/
supabase/functions/poll-gmail/
supabase/functions/morning-digest/
supabase/functions/check-overdue/
supabase/functions/send-notification/
supabase/migrations/
messages/
types/
```

## Step 5 — Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=placeholder
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
NEXT_PUBLIC_GOOGLE_CLIENT_ID=placeholder
GEMINI_API_KEY=placeholder
RESEND_API_KEY=placeholder
ENCRYPTION_KEY=placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Create `.env.example` with the same content.
Add `.env.local` to `.gitignore` (verify it's already there from create-next-app).

## Step 6 — Supabase Client Helpers
Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup')
  const isOnboarding = path.startsWith('/onboarding')
  const isDashboard = path.startsWith('/overview') || path.startsWith('/communications') ||
    path.startsWith('/finance') || path.startsWith('/planning') ||
    path.startsWith('/team') || path.startsWith('/settings')

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  return supabaseResponse
}
```

## Step 7 — Root Middleware
Create `middleware.ts` in project root:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Step 8 — Database Migration File
Create `supabase/migrations/001_initial_schema.sql` with the COMPLETE schema from `_docs/02-tech-stack.md` (the full SQL block). Copy it exactly.

## Step 9 — TypeScript Types File
Create `types/database.ts`:
```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Business = {
  id: string
  name: string
  logo_url: string | null
  country_code: string
  vat_number: string | null
  industry: string | null
  size_range: string | null
  locale: string
  timezone: string
  created_at: string
}

export type User = {
  id: string
  business_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'manager' | 'employee' | 'accountant'
  module_access: {
    communications: boolean
    finance: boolean
    planning: boolean
    team: boolean
  }
  status: 'active' | 'on_leave' | 'deactivated'
  created_at: string
}

export type Invoice = {
  id: string
  business_id: string
  client_name: string
  line_items: Array<{ description: string; quantity: number; unit_price: number }>
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  currency: string
  status: 'unpaid' | 'sent' | 'paid' | 'overdue'
  due_date: string
  issued_date: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  business_id: string
  conversation_id: string
  channel: 'gmail' | 'instagram' | 'facebook'
  gmail_message_id: string | null
  direction: 'inbound' | 'outbound'
  sender_email: string | null
  sender_name: string | null
  subject: string | null
  body_preview: string | null
  body_cached: string | null
  ai_summary: string | null
  ai_extracted: Json | null
  is_read: boolean
  received_at: string | null
  created_at: string
}

export type Notification = {
  id: string
  business_id: string
  user_id: string
  type: 'message' | 'invoice_overdue' | 'time_off' | 'shift_conflict' | 'invite'
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type Employee = {
  id: string
  business_id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  role_title: string | null
  created_at: string
}

export type Shift = {
  id: string
  business_id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  notes: string | null
  created_at: string
}

export type TimeOffRequest = {
  id: string
  business_id: string
  employee_id: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}
```

## Step 10 — i18n Setup
Create `messages/en.json`:
```json
{
  "nav": {
    "overview": "Overview",
    "communications": "Communications",
    "finance": "Finance",
    "planning": "Planning",
    "team": "Team & Roles",
    "settings": "Settings"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again"
  }
}
```

Create `messages/fr.json`:
```json
{
  "nav": {
    "overview": "Vue générale",
    "communications": "Communications",
    "finance": "Finance",
    "planning": "Planning",
    "team": "Équipe & Rôles",
    "settings": "Paramètres"
  },
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "retry": "Réessayer"
  }
}
```

Create empty placeholder files for the remaining locales (we'll fill them in Phase 14):
- `messages/de.json` — `{}`
- `messages/es.json` — `{}`
- `messages/it.json` — `{}`
- `messages/nl.json` — `{}`

Create `next-intl.config.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))
```

## Step 11 — CSS Variables (Design System)
Replace the contents of `app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-base: #F6F6F1;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F0F0EB;
  --border-default: #E8E8E2;
  --border-strong: #D4D4CE;
  --text-primary: #1A1A1A;
  --text-secondary: #4A4A4A;
  --text-muted: #6B6B6B;
  --text-disabled: #A8A8A8;
  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-light: #EEF3FE;
  --accent-text: #1E40AF;
  --green: #16A34A;
  --green-light: #F0FDF4;
  --amber: #D97706;
  --amber-light: #FFFBEB;
  --red: #DC2626;
  --red-light: #FEF2F2;
  --ai: #6366F1;
  --ai-light: #F0F0FF;
  --ai-border: #E0E0FF;
  --dark-card: #1A1A1A;
  --dark-card-surface: #2A2A2A;
  --dark-card-text: #FFFFFF;
  --dark-card-muted: #A0A0A0;
  --dark-card-subtle: #6B6B6B;
  --gmail: #DC2626;
  --gmail-light: #FEE2E2;
  --instagram: #9333EA;
  --instagram-light: #FDF4FF;
  --facebook: #2563EB;
  --facebook-light: #EFF6FF;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
}
```

Update `app/layout.tsx` to include DM Sans font from Google Fonts.

## Step 12 — Verify
Run these checks:
```bash
npm run build
npx tsc --noEmit
npm run lint
```
Fix any errors before marking complete.

## Completion
If all checks pass:
1. `git add .`
2. `git commit -m "feat: phase-01 complete — repo scaffold, folder structure, Supabase helpers, design tokens"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
