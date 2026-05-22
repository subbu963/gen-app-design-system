---
name: gen-app-design
description: Use this skill to generate well-branded interfaces and assets for gen-app, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping a Tauri v2 desktop + iOS LLM-widgets-on-a-canvas app.
user-invocable: true
version: 0.4.1
---

# gen-app design skill

Read the `README.md` file in this folder for the full design system — voice, visual foundations, iconography, component inventory, principles, and open questions. Then explore the rest:

| Where to look | What it gives you |
| --- | --- |
| `README.md` | Voice, visual foundations, iconography, component-to-Konsta mapping, open questions |
| `colors_and_type.css` | All design tokens as CSS custom properties (colors, type, spacing, radii, shadows, motion, blur) — `@import` it or copy what you need |
| `assets/` | Placeholder logo wordmark + app icon (gradient + mono), iconography mapping for Lucide→SF Symbols |
| `fonts/README.md` | Font stack notes — system fonts + Instrument Serif via Google Fonts |
| `preview/` | Atomic visual specimens for every token cluster — use these as visual references for what's "correct" |
| `ui_kits/gen-app/` | Click-thru recreation of the product with all core components as small JSX files; copy components from here |

## When you're asked to design for gen-app

1. **Always copy the relevant assets in.** When making a static HTML artifact, copy `colors_and_type.css`, the relevant component JSX files (or rewrite them inline), and any assets you reference from `assets/`. Don't link to external URLs that won't survive a download.
2. **Use the existing tokens.** Surfaces, accents, type, radii, motion — all defined as CSS variables. If you find yourself inventing a new color or radius, you're probably doing it wrong; pick the closest existing one.
3. **Respect the form-factor split.** Anything you ship must work as both a 320–400px iPhone screen and a 800–1200px desktop window. Mobile-first; desktop respectful.
4. **Match the voice.** Sentence case. Second person. Verbs on buttons. Periods only on full sentences. Em dashes over semicolons. See the `brand-voice` preview card for do/don't examples.
5. **Iconography:** stroke-only Lucide icons (1.75px), paired with text where possible. Map back to SF Symbols using `assets/iconography.md` when handing off.

## When the user invokes this skill without further guidance

Ask them what they want to build or design. Likely candidates:
- A new screen or flow for gen-app (settings page, widget detail, multi-select state, etc)
- A widget kind they want to mock (e.g. "a stock heatmap widget")
- An onboarding variant or empty state
- Marketing material in the same visual language

Then ask scoping questions (form factors, variants, level of fidelity). Act as an expert designer who outputs HTML artifacts **or** production-ready Konsta-aligned JSX code, depending on the need.

## What's flagged / inferred

These were assumed from the spec, not specified by the user. Treat them as defaults — replace with real choices when you have them.

- **Logo / wordmark.** Placeholder, made of `Instrument Serif` italic + gradient grid icon. Swap with a real logo when one exists.
- **Iconography.** Lucide stands in for SF Symbols (which can't be embedded on the web).
- **Symbols.** Rendered as glyph-prefixed colored tags (e.g. `# market`); the spec mentions "symbols" but their structural semantics are unclear.
- **iOS chat dock behaviour.** Two variants shipped (Dock A / Tab B); user choice pending.
- **Tone — "playful".** Calibrated to Arc / Things references. Tighten or loosen as needed.
