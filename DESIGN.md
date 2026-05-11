# FindIT Countdown — Design System

Last updated: 2026-05-11

## Aesthetic Direction

**Command-room countdown** — a high-stakes mission display, not a landing page. The UI is dark, monochromatic-blue with amber glow on the digits, as if rendered on a control panel. DESIGN_VARIANCE: 6, MOTION_INTENSITY: 5, VISUAL_DENSITY: 4.

## Type

| Role       | Family          | Weight | Notes                          |
|------------|-----------------|--------|--------------------------------|
| Body/UI    | Geist Sans      | 400–600 | Loaded via `next/font/google` |
| Digits/mono | Geist Mono     | 600    | All timer numerals             |
| Labels     | Geist Mono      | 400    | UPPERCASE, tracking-widest     |

No Inter. No system-ui as primary.

## Color Tokens

| Token              | Value                     | Usage                    |
|--------------------|---------------------------|--------------------------|
| background         | `oklch(0.11 0.05 245)`    | Page background          |
| findit-50          | `#eaf0fb`                 | Body text                |
| findit-300         | `#7492e6`                 | Secondary text/labels    |
| findit-500         | `#305cda`                 | Button backgrounds       |
| findit-yellow      | `#f5c842`                 | Timer digits, glow       |
| findit-cyan        | `#38bdf8`                 | Decorative accents       |
| alarm              | `oklch(0.22–0.38 0.18–0.22 25)` | Complete state bg flicker |

Shadows are always tinted to the blue hue — no pure black shadows.

## Layout

- Root: `min-h-[100dvh]` flex column — never `h-screen`
- Max content width: `max-w-2xl` centered
- Timer digits: CSS clamp for fluid scaling from 375px → 1440px
- Form: glass-card panel below the digits
- Decoratives: fixed `inset-0 pointer-events-none z-0`

## Motion

All CSS animations (no Framer Motion). Key animations:
- `float-a / float-b / float-c` — decorative SVG floating (7–11s, ease-in-out)
- `glow-pulse` — radial glow breathing (3s)
- `alarm-flash` — background flicker on complete state (0.75s)
- `rise-in` — page-load entrance with stagger classes (0.65s, easeOutExpo)

`@media (prefers-reduced-motion: reduce)` collapses all durations to 0.01ms.

## Component Map

```
page.tsx (Server)
├── DecorativeScene (Client, memo) — fixed glows + floating SVGs
├── EventHeader (Server) — logo + tagline
└── CountdownExperience (Client) — state machine
    ├── CountdownDisplay — digit blocks, status badge
    └── DurationForm — inputs, presets, controls
```

## Accessibility Checklist

- `role="timer"` on digit area with live aria-label
- `aria-live="polite"` on event label / status
- `aria-live="assertive"` on alarm completion message
- `aria-invalid` + `aria-describedby` on form validation errors
- All buttons use `<button>` with visible `focus-ring` (2px blue outline)
- Decorative SVGs carry `aria-hidden="true"` or empty alt
- Touch targets minimum 44px height on all controls
