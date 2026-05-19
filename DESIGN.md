# marketingperformance.net — Design System

## Brand

- **Company:** Marketing Performance Group — 31-year company
- **Product:** EngageEngine™ (trademark, always with ™)
- **Tagline:** "Powered by EngageEngine™"
- **Voice:** Direct, specific, no fluff. "We fix it in 90 days" not "We help you grow."

---

## Colors

Defined in `tailwind.config.mjs`. Components also hardcode some values — use the Tailwind tokens.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0D1828` | Page background |
| `surface` | `#1B2A4A` | Card/panel background |
| `border` | `#253B66` | Dividers, card gaps |
| `accent` | `#C8A84B` | Gold — CTAs, numbers, highlights, section labels |
| `heading` | `#F4F1EA` | All headings, prominent text |
| `body` | `#C5D3E3` | Body copy |
| `subtle` | `#8BA8C8` | Secondary body, mechanism lines |
| `muted` | `#5C7BAA` | Labels, micro-copy, footnotes |
| `steel` | `#2E5D8E` | Hero radial gradient tint |

**Selection:** `background #C8A84B, color #0D1828` (gold on dark — defined in global.css)

**Hero background:** Radial gradient `rgba(46,93,142,0.22)` over `#0D1828` — defined as `.hero-bg` utility class.

**Card hover:** `#0F1F36` — not a Tailwind token, hardcoded in SymptomWall card hover.

---

## Typography

Loaded via Google Fonts in `Base.astro`:
- **Playfair Display** — 700, 900 — all headings
- **DM Sans** — 300, 400, 500 — all body, UI, labels

> Note: `tailwind.config.mjs` lists `DM Serif Display` and `Inter` as font families — these are wrong/unused. The Tailwind `font-serif` and `font-sans` classes work because component scoped CSS overrides with the correct `font-family` declarations directly. Do not rely on Tailwind font-family tokens; use scoped CSS.

### Scale

| Role | Size | Weight | Font | Line-height |
|---|---|---|---|---|
| Hero h1 | `clamp(36px, 8vw, 58px)` | 900 | Playfair | 1.08 |
| Section h2 | `clamp(32px, 5vw, 48px)` | 700 | Playfair | 1.15 |
| Card title | 20–21px | 700 | Playfair | 1.3 |
| Hero lead | 17px | 300 | DM Sans | 1.65 |
| Body | 16–17px | 300–400 | DM Sans | 1.65–1.7 |
| Setup/setup line | 18px | 300 | DM Sans | 1.5 |
| Section label | 11px | 400 | DM Sans | — |
| Nav links | 13px | 400–500 | DM Sans | — |

### Section labels
Always: `text-xs tracking-[0.2em] uppercase text-muted font-sans block mb-8`
Format: `/ SECTION NAME` (slash prefix, all caps)

---

## Spacing

| Context | Value |
|---|---|
| Standard section | `py-24 px-6` (96px vertical, 24px horizontal) |
| Emphasis section (FinalCTA) | `py-32 px-6` |
| Hero | `padding: 52px 32px 56px` |
| Hero mobile | `padding: 36px 20px 44px` |
| Card | `p-8 lg:p-10` (32px / 40px) |
| Card mobile | `28px 24px` |

### Max widths

| Context | Value |
|---|---|
| Hero / prose sections | `max-w-[720px]` or `max-w-3xl` (centered) |
| Card grids | `max-w-7xl` (full-bleed feel) |
| Guarantee / FinalCTA | `max-w-3xl` |
| Mechanism lines | `max-w-xl` or `max-w-2xl` |

---

## Buttons

### Primary (gold)
```
bg-accent text-bg font-sans font-medium px-8 py-4 text-base
hover:bg-heading transition-colors duration-200
```
Large variant: `px-10 py-5 text-lg`

### Outline
```
border border-accent/50 text-accent font-sans font-medium px-10 py-5 text-lg
hover:bg-accent/10 transition-colors duration-200
```

### Ghost / text link
```
text-sm text-muted hover:text-accent transition-colors duration-200 font-sans
```

**Rule:** Never use `bg-white text-black` for CTAs. All primary actions use gold.

---

## Component Patterns

### Mechanism / callout block
Gold left border, steel-blue text:
```css
font-size: 14px;
line-height: 1.7;
color: #8ba3bf;  /* subtle token */
padding-left: 16px;
border-left: 2px solid rgba(201,168,76,0.3);
```

### Card grid (SymptomWall pattern)
Thin-line dividers via gap-px on colored background:
```
grid grid-cols-1 md:grid-cols-2 gap-px bg-border
```
Each card: `bg-surface p-8 lg:p-10 hover:bg-[#0F1F36] transition-colors duration-300`

### Section separator
Between sections: `border-t border-border`
Between hero and card grid: `pt-8 border-t border-border`

### Animations
- `fadeUp`: `opacity 0 → 1, translateY 18px → 0`, `0.6s ease`
- `data-animate` attribute on elements = scroll-triggered fadeUp
- `data-delay="0.1"` etc. for staggered entrance

---

## Navigation

- Logo: DM Sans 500, 15px, letter-spacing 0.08em / gold subtext 10px
- Primary CTA: gold text (`nav-diagnostic` class), font-weight 500
- Secondary links: 60% opacity, full opacity on hover
- **Mobile (< 640px):** Secondary links (`Free Toolkit →`, `The Build`) hidden with `hidden sm:inline`. Only primary CTA visible.

---

## Terminology Rules

| Use | Never use |
|---|---|
| "Free Diagnostic →" (Nav) | "Find My Profit Leak" in Nav |
| "Start the Free Diagnostic →" (Guarantee) | "Find My Profit Leak" in CTAs |
| "Take the Free Diagnostic →" (FinalCTA) | |
| "What Fixing the Right Problem Looks Like." (Testimonials h2) | "The Leak Gets Fixed. Revenue Follows." |
| "31 years" (Guarantee) | "28 years" or any other number |
| `aaron@marketingperformance.net` (onboarding emails) | `aiden@marketingperformance.net` (invalid) |
| Specific client results ("$440K in one week") | Aggregated/constructed figures ($529M+) |

---

## Deployment

- **Production:** `rough-brook-782b` Worker — `npx wrangler deploy -c wrangler-worker.toml`
- **Staging:** `engageengine-staging` Pages — `npx wrangler pages deploy dist` (do NOT use for production)
- **Worktree:** `/Users/robbiebutt/.claude/worktrees/youthful-tu/`
- **Build:** `npm run build` (Astro + Cloudflare Workers adapter)

---

## Known Gaps (as of 2026-05-08)

- `b2b.astro` still uses "Find My Profit Leak" in hero button and section labels — not yet updated to match homepage terminology
- Full a11y audit not done (keyboard nav, ARIA landmarks, contrast verification)
- Tailwind font-family tokens (`font-serif`, `font-sans`) don't match actual loaded fonts — fix tailwind.config.mjs to use Playfair Display / DM Sans
