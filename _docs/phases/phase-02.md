# Phase 02 — Authentication (Signup, Login, Password Reset)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the complete auth flow: signup, login, Google OAuth, and password reset. All pages are full-screen (no sidebar, no topbar). Use Supabase Auth.

## Context
Read `_docs/01-product-spec.md` section 2 (Auth) and `_docs/03-design-system.md` before starting.

## Step 0 — Version Check
```bash
npm info @supabase/supabase-js version
```
Confirm installed version matches latest.

## Step 1 — Shared Auth Layout
Create `app/(auth)/layout.tsx`:
- Full screen, cream background (`var(--bg-base)`)
- Centered card: `max-width: 440px`, white, `border-radius: 12px`, `padding: 40px`
- Omnexia logo top-left of the card (black square with white N, 32px)
- No sidebar, no topbar

## Step 2 — Login Page (`app/(auth)/login/page.tsx`)
Fields:
- Email input
- Password input (with show/hide toggle)
- "Sign in" primary button (full width)
- Divider: "or"
- "Continue with Google" button (white, border, Google icon SVG inline)
- Link: "Don't have an account? Sign up" → `/signup`
- Link: "Forgot password?" → `/reset-password`

Behaviour:
- Email/password → `supabase.auth.signInWithPassword()`
- Google → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/api/auth/callback/google', scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly' } })`
- On success → redirect to `/onboarding` if onboarding not complete, else `/overview`
- Show inline error messages (red, below the relevant field)
- Loading state on button while request is in flight

## Step 3 — Signup Page (`app/(auth)/signup/page.tsx`)
Fields:
- Full name input
- Email input
- Password input (min 8 chars, show/hide toggle)
- "Create account" primary button (full width)
- Divider: "or"
- "Continue with Google" button
- Link: "Already have an account? Sign in" → `/login`
- Small text: "By signing up you agree to our Terms of Service and Privacy Policy"

Behaviour:
- `supabase.auth.signUp()` with email/password
- On success → redirect to `/onboarding`
- Validation with Zod + React Hook Form
- Show field-level errors

## Step 4 — Password Reset Page (`app/(auth)/reset-password/page.tsx`)
Fields:
- Email input
- "Send reset link" button
- Link back to login

Behaviour:
- `supabase.auth.resetPasswordForEmail()`
- Show success state: "Check your email for a reset link"

## Step 5 — Google OAuth Callback (`app/api/auth/callback/google/route.ts`)
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
```

## Step 6 — Shared Form Components
Create `components/ui/auth-card.tsx` — the white card wrapper used on all auth pages.
Create `components/ui/google-button.tsx` — the "Continue with Google" button with inline SVG Google logo.
Create `components/ui/password-input.tsx` — password field with show/hide eye icon toggle.

## Step 7 — Verify
1. `npm run dev`
2. Open `localhost:3000/login` — does it render correctly?
3. Open `localhost:3000/signup` — does it render correctly?
4. Open `localhost:3000/reset-password` — does it render correctly?
5. `npm run build` — must pass
6. `npx tsc --noEmit` — must pass

## Completion
1. `git add .`
2. `git commit -m "feat: phase-02 complete — auth pages (login, signup, reset, Google OAuth callback)"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
