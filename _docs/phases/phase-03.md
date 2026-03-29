# Phase 03 — Onboarding Wizard (9 Steps)
**MILESTONE PHASE** — pause and await CONTINUE after completion.

## Your Job
Build the complete 9-step onboarding wizard. Full-screen layout (no sidebar). Each step is a component. State persists across steps.

## Context
Read `_docs/01-product-spec.md` section 3 (Onboarding Wizard) and `_docs/03-design-system.md` section 11 (Onboarding design) before starting.

## Step 0 — Version Check
```bash
npm info next-intl version
```

## Step 1 — Onboarding Layout (`app/(onboarding)/layout.tsx`)
- Full screen, `var(--bg-base)` background
- Centered card: `max-width: 520px`, white, `border-radius: 12px`, `padding: 40px`
- Omnexia logo top-left (outside card, top of page)
- Progress bar: thin (4px), accent blue, full width at top of card, animates between steps
- Step counter: "Step 2 of 9" in muted text above the step title
- Back + Next/Skip buttons at bottom of card
- No sidebar, no topbar

## Step 2 — Wizard Controller (`app/(onboarding)/onboarding/page.tsx`)
- Manages current step state (useState, 1–9)
- Manages form data state across all steps
- Renders the correct step component based on current step
- On final step completion → save to Supabase → redirect to `/overview`

Use this data shape:
```typescript
type OnboardingData = {
  locale: string           // step 1
  businessName: string     // step 2
  logoFile?: File          // step 2
  countryCode: string      // step 3
  industry?: string        // step 4
  companySize?: string     // step 5
  gmailConnected: boolean  // step 6
  activeModules: string[]  // step 7
  invitedEmails: string[]  // step 8
}
```

## Step 3 — Build Each Step Component

Create `app/(onboarding)/onboarding/steps/` with these files:

### Step1Welcome.tsx
- Title: "Welcome to Omnexia"
- Subtitle: "Your Business OS for Europe"
- Show detected language with flag emoji: "We detected your language as 🇫🇷 French"
- Language selector dropdown (EN/FR/DE/ES/IT/NL with flag emojis)
- "Get started" button (no back button on step 1)

### Step2Business.tsx
- Title: "Tell us about your business"
- Business name input (required, validated)
- Logo upload: dashed border box, click to upload, shows preview if file selected
- "Upload logo" label, "(optional)" in muted text
- Skip logo button if no file selected

### Step3Country.tsx
- Title: "Where is your business based?"
- Country dropdown with flags:
  🇫🇷 France / 🇩🇪 Germany / 🇪🇸 Spain / 🇮🇹 Italy / 🇳🇱 Netherlands / 🇧🇪 Belgium / 🇵🇹 Portugal / 🇦🇹 Austria / 🇸🇪 Sweden / 🇵🇱 Poland / 🌍 Other EU
- Below the dropdown, show what this sets:
  "This sets your language, VAT format, and currency"
- Required — no skip

### Step4Industry.tsx
- Title: "What type of business are you?"
- 5 large clickable cards (not a dropdown):
  - 🛍️ E-commerce
  - 🏢 Agency
  - 💼 Consulting
  - 🏪 Physical Retail
  - 🔧 Other
- Selected card gets accent border + light blue background
- Skip button available

### Step5Size.tsx
- Title: "How many employees do you have?"
- 3 large clickable cards:
  - 1–10 employees
  - 11–50 employees
  - 51–100 employees
- Skip button available

### Step6Gmail.tsx
- Title: "Connect your Gmail"
- Subtitle: "Required to use the Communications module"
- Large Gmail icon + description of what Omnexia will access:
  ✓ Read and send emails
  ✓ Sync your inbox
  ✓ Calendar availability (optional)
- "Connect Gmail" button → triggers Google OAuth (same flow as auth)
- Show connected state (green checkmark, email address) after OAuth
- Required — but show "Skip for now" in very small muted text below (edge case)

### Step7Modules.tsx
- Title: "Choose your modules"
- Subtitle: "You can change this anytime in Settings"
- 4 toggle cards (all ON by default):
  - 📨 Communications — Unified inbox
  - 💰 Finance — Invoices & expenses
  - 📅 Planning — Team scheduling
  - 👥 Team & Roles — Manage your team
- Each card has a toggle switch on the right
- Communications is locked ON (can't be disabled)
- Skip button available

### Step8Invite.tsx
- Title: "Invite your team"
- Subtitle: "Send invite links to your colleagues"
- Email input + "Add" button
- List of added emails with × to remove
- "Send invites" button
- Skip button: "I'll do this later"

### Step9Done.tsx
- Title: "You're all set! 🎉"
- Summary of what was configured
- Single button: "Go to Dashboard" → saves all data + redirects

## Step 4 — Save Onboarding Data
On Step 9 completion, save to Supabase:
1. Create `businesses` row with all business data
2. Update `users` row with `business_id`
3. Upload logo to Supabase Storage if provided (`business-logos` bucket)
4. Send invite emails via API route if emails were added
5. Mark onboarding complete (add `onboarding_complete: true` to user metadata)

## Step 5 — Verify
1. `npm run dev`
2. Navigate to `/onboarding` — walk through all 9 steps manually
3. Back/forward navigation works
4. Progress bar updates correctly
5. Required steps block Next button if empty
6. `npm run build` passes

## Completion
1. `git add .`
2. `git commit -m "feat: phase-03 complete — 9-step onboarding wizard with locale detection, Gmail connect, module selection"`

**✅ MILESTONE — output checkpoint message and wait for CONTINUE.**
