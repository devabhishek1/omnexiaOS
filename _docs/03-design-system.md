# Omnexia — Design System
**Version:** 1.0 | **Status:** Locked

---

## 1. Design Philosophy

Omnexia is a professional B2B tool. The design language is:
- **Functional minimalism** — every element earns its place
- **European sensibility** — restrained, typographically serious, not Silicon Valley loud
- **Shopify-DNA** — clean sidebar, white cards, cream background, high information density without clutter
- **Trustworthy** — this handles real business data; the UI must feel reliable and calm

**What we are NOT:** Dark SaaS purple gradients. Rounded-everything bubbly. Consumer-app playful. Enterprise grey slab.

---

## 2. Color Palette

```css
:root {
  /* Backgrounds */
  --bg-base: #F6F6F1;          /* Cream — main app background */
  --bg-surface: #FFFFFF;        /* White — cards, panels, sidebar */
  --bg-elevated: #F0F0EB;      /* Slightly darker cream — hover states, nested areas */

  /* Borders */
  --border-default: #E8E8E2;   /* Subtle warm grey */
  --border-strong: #D4D4CE;    /* Stronger border for tables */

  /* Text */
  --text-primary: #1A1A1A;     /* Near-black — headings, primary content */
  --text-secondary: #4A4A4A;   /* Dark grey — body text */
  --text-muted: #6B6B6B;       /* Muted — labels, metadata, placeholders */
  --text-disabled: #A8A8A8;    /* Disabled states */

  /* Accent — Blue (primary action) */
  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-light: #EEF3FE;
  --accent-text: #1E40AF;

  /* Semantic — Green (success, paid, active) */
  --green: #16A34A;
  --green-light: #F0FDF4;

  /* Semantic — Amber (warning, pending, partial) */
  --amber: #D97706;
  --amber-light: #FFFBEB;

  /* Semantic — Red (error, overdue, urgent) */
  --red: #DC2626;
  --red-light: #FEF2F2;

  /* AI — Indigo (AI-generated content) */
  --ai: #6366F1;
  --ai-light: #F0F0FF;
  --ai-border: #E0E0FF;

  /* Dark card (AI Digest) */
  --dark-card: #1A1A1A;
  --dark-card-surface: #2A2A2A;
  --dark-card-text: #FFFFFF;
  --dark-card-muted: #A0A0A0;
  --dark-card-subtle: #6B6B6B;

  /* Channel colours */
  --gmail: #DC2626;
  --gmail-light: #FEE2E2;
  --instagram: #9333EA;
  --instagram-light: #FDF4FF;
  --facebook: #2563EB;
  --facebook-light: #EFF6FF;
}
```

---

## 3. Typography

**Font stack:** `'DM Sans', 'Helvetica Neue', Arial, sans-serif`

Load via Google Fonts: `DM Sans` weights 400, 500, 600, 700, 800.

```css
/* Scale */
--text-xs:   11px / 1.4  /* Badges, micro labels */
--text-sm:   12px / 1.5  /* Table cells, metadata */
--text-base: 13px / 1.6  /* Body text, nav items */
--text-md:   14px / 1.6  /* Card content, descriptions */
--text-lg:   15px / 1.5  /* Section titles, card headers */
--text-xl:   16px / 1.4  /* Page titles in topbar */
--text-2xl:  20px / 1.3  /* Stat card values */
--text-3xl:  28px / 1.2  /* Large KPI numbers */
--text-4xl:  36px / 1.1  /* Hero metrics */

/* Weights */
Regular:   400  — body text, descriptions
Medium:    500  — card content, slightly emphasised
Semibold:  600  — labels, nav items active, table headers
Bold:      700  — stat values, page titles
ExtraBold: 800  — logo, hero numbers
```

---

## 4. Spacing System

Base unit: 4px

```
4px   — xs (tight gaps within components)
8px   — sm (inner padding small)
12px  — md (gaps between elements)
16px  — lg (card padding small, grid gap)
20px  — xl (sidebar nav padding)
24px  — 2xl (card padding standard)
28px  — 3xl (page content padding)
32px  — 4xl (section gaps)
48px  — 5xl (large section breaks)
```

---

## 5. Component Specifications

### Card
```css
background: var(--bg-surface);
border: 1px solid var(--border-default);
border-radius: 12px;
padding: 24px;
```

### Sidebar
```css
width: 220px;
background: var(--bg-surface);
border-right: 1px solid var(--border-default);
position: fixed;
top: 0; bottom: 0;
```

### Topbar
```css
height: 56px;
background: var(--bg-surface);
border-bottom: 1px solid var(--border-default);
position: sticky;
top: 0;
z-index: 10;
padding: 0 28px;
```

### Nav Item
```css
/* Default */
padding: 9px 10px;
border-radius: 8px;
color: var(--text-muted);
font-weight: 400;
font-size: 14px;

/* Active */
background: var(--accent-light);
color: var(--accent);
font-weight: 600;
```

### Button — Primary
```css
background: var(--accent);
color: #FFFFFF;
padding: 8px 16px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
border: none;
cursor: pointer;

/* Hover */
background: var(--accent-hover);
```

### Button — Secondary
```css
background: var(--bg-base);
color: var(--text-primary);
border: 1px solid var(--border-default);
padding: 8px 16px;
border-radius: 8px;
font-size: 13px;
font-weight: 500;
```

### Button — Ghost
```css
background: transparent;
color: var(--accent);
border: none;
font-size: 12px;
font-weight: 500;
cursor: pointer;
```

### Badge
```css
font-size: 11px;
font-weight: 600;
padding: 2px 8px;
border-radius: 20px;
letter-spacing: 0.02em;
/* Color set from semantic palette */
```

### Avatar
```css
border-radius: 50%;
background: var(--border-default);
color: var(--text-muted);
font-weight: 700;
letter-spacing: 0.02em;
/* Sizes: 28px (sidebar company), 32px (user footer), 36px (tables) */
```

### Section Title (uppercase label above sections)
```css
font-size: 13px;
font-weight: 600;
color: var(--text-muted);
letter-spacing: 0.08em;
text-transform: uppercase;
margin-bottom: 16px;
```

### AI Badge
```css
background: var(--ai-light);
color: var(--ai);
font-size: 10px;
font-weight: 700;
padding: 2px 7px;
border-radius: 20px;
letter-spacing: 0.05em;
border: 1px solid var(--ai-border);
content: "✦ AI";
```

### Table
```css
width: 100%;
border-collapse: collapse;

/* Header row */
background: var(--bg-base);
font-size: 12px;
color: var(--text-muted);
font-weight: 600;
padding: 12px 20px;

/* Body rows */
border-top: 1px solid var(--border-default);
padding: 16px 20px;
font-size: 13px;
```

### Input / Form Field
```css
border: 1px solid var(--border-default);
border-radius: 8px;
padding: 9px 12px;
font-size: 14px;
background: var(--bg-surface);
color: var(--text-primary);
width: 100%;

/* Focus */
border-color: var(--accent);
outline: none;
box-shadow: 0 0 0 3px var(--accent-light);
```

### Dark Card (AI Digest)
```css
background: var(--dark-card);
border: none;
border-radius: 12px;
padding: 24px;
color: var(--dark-card-text);
```

### Channel Badge
```css
/* Gmail */
background: var(--gmail-light); color: var(--gmail);
/* Instagram */
background: var(--instagram-light); color: var(--instagram);
/* Facebook */
background: var(--facebook-light); color: var(--facebook);

font-size: 11px;
font-weight: 600;
padding: 2px 8px;
border-radius: 20px;
```

---

## 6. Layout Grid

### Dashboard layout
```
[Sidebar 220px fixed] | [Main content flex-1, margin-left: 220px]
                        [Topbar 56px sticky]
                        [Page content padding: 28px]
```

### Overview page grid
```
Full width: Alert strip
Full width: AI Digest card
4-col grid: Stat cards (gap: 16px)
Full width: Quick actions row
2-col grid (60/40): Messages panel | Finance snapshot
Full width: Who's In Today
```

### Communications layout
```
Left panel: 320px fixed
Right panel: flex-1
Top filter bar: full width above both panels
```

### Finance layout
```
Full width: KPI bar
2-col grid (50/50): Revenue chart | Cash flow chart
Full width: VAT panel
Full width: Invoice Kanban board
Full width: Expense table
```

---

## 7. Iconography

Use `lucide-react` exclusively. Icon size: 16px for inline, 20px for nav items.

Key icon assignments:
- Overview → `LayoutDashboard`
- Communications → `Inbox`
- Finance → `Receipt`
- Planning → `Calendar`
- Team → `Users`
- Settings → `Settings`
- Notifications → `Bell`
- Gmail → custom SVG badge
- Compose → `PenSquare`
- Search → `Search`
- Urgent → `AlertTriangle`
- AI → `Sparkles`

---

## 8. Motion & Transitions

Keep transitions subtle and fast. This is a productivity tool, not a marketing site.

```css
/* Default transition */
transition: all 0.15s ease;

/* Page transitions */
/* Use Next.js layout animations — fade in only, no slide */
opacity: 0 → 1 over 200ms

/* Sidebar nav active state */
transition: background 0.1s, color 0.1s;

/* Card hover (only for clickable cards) */
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
transition: box-shadow 0.15s;
```

No heavy animations. No skeleton loaders for everything — use them only for the inbox and digest card.

---

## 9. Empty States

Every module must handle empty states gracefully.

Pattern:
```
[Icon — large, muted]
[Primary text — "No messages yet"]
[Secondary text — "Connect Gmail to start receiving messages"]
[CTA button — if action available]
```

Empty states use `--text-muted` color, centered in the content area.

---

## 10. Responsive Behaviour

v1 targets desktop only (1280px+). Sidebar collapses to icon-only at 1024px. Below 768px: show "Desktop recommended" banner. No mobile layout in v1.

---

## 11. Onboarding Wizard Design

- Full-screen layout (no sidebar, no topbar)
- Centered card: max-width 520px
- Progress bar at top: thin, accent-colored, animates between steps
- Step counter: "Step 2 of 9" in muted text
- Back + Next/Skip buttons at bottom of card
- Logo in top-left corner only
- Background: `--bg-base` (cream)
