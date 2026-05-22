# gen-app Design System

**Current version: `0.3.0`** · [Changelog](CHANGELOG.md)

A design system for **gen-app** — a Tauri v2 desktop + iOS app where you chat with an LLM and it builds live, self-updating widgets on a canvas. The system codifies an iOS-first, dark-only aesthetic that scales gracefully into a resizable macOS window.

> **Source material.** This system was built from the product spec only — no codebase, Figma, or screenshots were attached. Where decisions were inferred rather than read, they are flagged with **⚠︎ INFERRED** so you can correct them.
>
> Fixed constraints provided by the user:
> - React 19, Tailwind v4, **Konsta UI** (the iOS component kit for React)
> - Dark-only iOS theme — palette `#1C1C1E` (window) · `#2C2C2E` (cards) · `#0A84FF` (accent)
> - Dual form factor: resizable desktop window AND iOS phone — every flow must work on both
> - API keys live in the OS keychain; the LLM emits declarative widget specs, never code
>
> **Update — theme switching.** The spec said dark-only, but on user request we added light + auto themes. Default is still dark. Light mode uses iOS HIG light tokens (`#F2F2F7` window, `#FFFFFF` card, `#007AFF` accent). Auto follows `prefers-color-scheme`. Settings → Appearance and the Tweaks panel both expose the picker.

---

## Index

| File | What's inside |
| --- | --- |
| `README.md` | This file — voice, visual foundations, iconography, component inventory, principles, open questions |
| `CHANGELOG.md` | Per-version release notes — see [Versioning](#versioning) for what each bump means |
| `SKILL.md` | Claude Skills entry point — use this design system as a downloadable skill |
| `colors_and_type.css` | CSS custom properties: colors, type, spacing, radii, shadows, motion, blur |
| `tailwind.js` | Tailwind v4 CDN bootstrap + `@theme` bridge to design tokens — any HTML file opts in with one `<script>` |
| `assets/` | Logo wordmark, app mark (colored + mono), brand SVGs |
| `fonts/` | Webfont notes (system fonts + Instrument Serif via Google Fonts) |
| `preview/` | Atomic preview cards rendered into the **Design System** tab — one card per token cluster |
| `ui_kits/gen-app/` | Single UI kit covering desktop + iOS · Konsta-aligned JSX components · click-thru `index.html` · `extension-manifest.d.ts` TypeScript schema for extensions |

---

## Versioning

The system follows **design semver** — `MAJOR.MINOR.PATCH` mapped to design impact, not API surface:

| Bump | When |
| --- | --- |
| **MAJOR** (`1.0.0`) | Visual identity changes — palette overhaul, type system swap, brand reset |
| **MINOR** (`0.4.0`) | New components, new screens, new tokens, deprecations |
| **PATCH** (`0.3.1`) | Token tweaks, copy fixes, bug fixes, asset replacements |

Currently at **`0.3.0`** — early, expect breaking changes between minors. All changes are recorded in [CHANGELOG.md](CHANGELOG.md). The format is loosely [Keep a Changelog](https://keepachangelog.com) with two design-specific sections: **Reworked** (visual changes to existing surfaces) and **Flagged** (open questions / inferred decisions still pending).

When shipping a change:
1. The unreleased entry at the top of `CHANGELOG.md` accumulates everything since the last tag.
2. On "tag this", the entry is renamed to the next version with today's date.
3. `README.md` (this file) and `SKILL.md` are bumped to match.

---

## Design principles

The whole system rolls up to five principles. When you're stuck, return here.

1. **The canvas is the document. Chat is the cursor.** Every meaningful action — create, edit, delete a widget — happens because the user asked for it in chat. The dock is small but always reachable; the canvas is generous and reorders itself around the user's hand.
2. **iOS first, desktop respectful.** Components are Konsta UI primitives sized for touch. On desktop they sit inside a window with the same radii, the same blur, the same dock — just wider. We do not invent a separate "desktop look".
3. **Dark-only, but not flat.** We rely on stacked surfaces (`base → window → card → elevated`), hairline separators, and the occasional vibrancy blur — not heavy shadows. Color is a navigation cue, not decoration.
4. **Specs over screenshots.** Widgets are declarative; the LLM never emits code. The UI never lies about what the model "did" — if a widget is pending, it says so; if data is stale, it says so.
5. **Playful where it matters; quiet everywhere else.** Empty states, onboarding moments, and confirmations get warmth (a serif italic flourish, a small spring animation). Settings, errors, and dense states get the system font and shut up.

---

## Content fundamentals

### Voice
Conversational and warm — closer to *Things* or *Arc* than to *macOS Settings*. The app introduces itself as a peer, not a tool. Sentences are short. Punctuation is honest.

- **Person:** Second person ("you") when addressing the user; first-person plural ("we'll") when the app does work. Never first-person singular — gen-app is not an assistant pretending to be a friend.
- **Casing:** Sentence case everywhere — buttons, headings, menu items, settings labels. Title Case is reserved for proper nouns (provider names: Groq, OpenRouter, OpenAI, Ollama).
- **Punctuation:** Periods on full sentences in body copy. No periods on button labels or single-line inputs. Em dashes (—) over semicolons. The Oxford comma stays.
- **Numbers:** Numerals always, even one-digit ("1 widget", not "one widget"). Time stamps use relative phrasing ("just now", "3 min ago", "yesterday").
- **Emoji:** None in the app chrome or system copy. The model may emit them; the app renders whatever it gets.
- **Unicode glyphs:** Used sparingly and intentionally — `↓ ↑ ← → ⌘ ⌥ ⏎ · ✦`. Always paired with a word, never alone.

### Copy examples

| Surface | ✅ Do | ❌ Don't |
| --- | --- | --- |
| Empty canvas | "Nothing here yet. Ask for something below ↓" | "Your canvas is empty. Get started by creating your first widget!" |
| First-run welcome | "Hi. Let's pick a brain." | "Welcome to gen-app! Configure your settings to begin." |
| Provider step | "Pick a provider. We'll keep the key in your keychain." | "Please select an LLM provider and securely store your API key." |
| Widget loading | "Cooking up a chart…" | "Loading data, please wait." |
| Network error | "Groq blinked. Retry?" | "Error: Request failed with status 503." |
| Confirm destructive | "Toss this widget?" with `Toss` / `Keep` buttons | "Are you sure you want to delete this widget?" |
| Bulk action | "5 widgets selected · Tag · Duplicate · Toss" | "5 items selected. Choose an action." |
| Settings header | "Brains" (Providers) · "Senses" (Embeddings) · "Powers" (Extensions) · "Diaries" (Logs) | "LLM Configuration" |

> **Playful section names** ("Brains", "Powers") only appear in iOS settings where space is tight and tone matters. The desktop sidebar uses the conventional names ("Providers", "Extensions") for scannability. Both are listed in the Settings spec.

### Microcopy patterns

- **Buttons are verbs.** `Add provider`, `Try a sample`, `Toss`, `Keep`, `Retry`, `Connect`.
- **Toasts are one breath.** "Widget added." "Provider saved." Never two sentences.
- **Errors offer a next step.** Never just "Something went wrong" — always "X. Y?" where Y is a retry or alternative.
- **Loading states have personality, briefly.** "Cooking up…", "Drawing…", "Asking the model…" — but only on first paint; subsequent reloads are silent.

---

## Visual foundations

### Color — three jobs only
1. **Surfaces** stack from black to light gray to convey elevation: `#000` base → `#1C1C1E` window → `#2C2C2E` card → `#3A3A3C` elevated.
2. **Accent** (`#0A84FF`) is the *only* brand color in the app chrome — used for active state, primary CTAs, selection, focus rings. It never decorates.
3. **Status colors** (iOS systemX dark variants: green/orange/red/yellow/purple/teal) appear *only* inside widgets to communicate state. The chrome stays gray + accent.

Soft tints (`rgba(color, 0.16)`) carry status pills and chips. Filled status colors only on dots and inline numerals.

### Type
- **Family:** native SF Pro stack via `-apple-system` — looks correct on every Apple surface, costs nothing, weighs nothing. We do not load Inter or Roboto.
- **Mono:** SF Mono / `ui-monospace`.
- **Brand display:** **Instrument Serif (italic)** loaded from Google Fonts. Used only in the wordmark and *one* moment per screen at most — an onboarding headline, an empty-state hero. It's a flourish, not a workhorse.
- **Scale:** iOS HIG-aligned (11/12/13/15/17/20/22/28/34) with a 44px hero step for desktop.
- **Tracking:** display sizes tighten to `-0.022em`; body stays at 0; overlines widen to `0.04em`.
- **Weights:** 400 / 500 / 600 / 700. Avoid 300 — too thin against dark surfaces.

### Spacing — 4pt grid
0 / 2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80.
Card padding is `--space-5` (16) on iOS, `--space-7` (24) on desktop. Widget gutter on the canvas is `--space-4` (12).

### Radii — continuous, generous
4 (chip) · 8 (button) · 10 (tile) · **14 (widget card — iOS default)** · 18 (sheet) · 22 (screen edge) · 28 (huge surface).
Continuous corners — Konsta handles this; never `border-radius: 50%` on a square.

### Backgrounds
- **No imagery in chrome.** No gradients, no patterns, no textures. The canvas itself is plain `#1C1C1E`.
- **No full-bleed photography.** Imagery, if any, sits inside widgets — never as page background.
- **Subtle grid in the canvas only.** Dot grid at 24px, `rgba(255,255,255,0.04)` — visible enough to anchor drag operations, invisible at a glance.
- **Vibrancy blur on dock and sheets.** `backdrop-filter: blur(30px) saturate(160%)` over `rgba(28,28,30,0.72)`. This is the only place the system uses translucency.

### Borders & dividers
- **Hairlines, not borders.** `1px solid rgba(84,84,88,0.65)` — iOS separator color. Used on lists and between sections.
- **Cards have no border by default** — surface contrast does the work. A `1px solid rgba(255,255,255,0.06)` "soft stroke" appears only when a card sits on the same surface as its container (rare).
- **Selected widget:** `2px` outset accent ring at `rgba(10,132,255,0.55)` + soft glow. Never a heavy 4px border.

### Shadows & elevation
Dark UIs use shadows sparingly — most "elevation" is surface contrast + a 1px inner highlight (`rgba(255,255,255,0.04) inset`). Drop shadows only appear on truly floating things:
- **Dock** at rest — `--elev-2`
- **Open sheet / dropdown** — `--elev-3`
- **Drag preview (widget being moved)** — `--elev-4`
- **Focus glow** — `0 0 0 1px focus + 0 0 0 4px tint` (no offset)

### Motion
- **Easing:** `standard` for state changes, `emphasized` for enters, `spring` (overshoot 1.56) for the playful pop — used on widget-creation entry, "toss" exit, and tag confirmations.
- **Duration:** 120 / 200 / 320 / 480ms. Most UI is 200ms.
- **No fades for navigation** — slide on iOS (Konsta default), cross-fade only for sheets.
- **The widget-just-created animation:** scale `0.96 → 1.02 → 1` with opacity `0 → 1`, 320ms spring. It happens *once* per widget. Subsequent updates don't animate the card; only the data inside does.

### Hover & press states
- **Hover (desktop only):** background lightens by 4% (`rgba(255,255,255,0.04)` on top). No color shift, no scale.
- **Press (desktop + iOS):** background by 8% (`rgba(255,255,255,0.08)`) AND a 1% scale-down (`scale(0.99)`) on cards. Buttons just lighten — no scale.
- **Disabled:** opacity 0.4. Pointer-events stay enabled so tooltips can explain why.
- **Accent button hover:** color brightens to `#409CFF`. Accent button press: no scale, just darker.

### Transparency & blur
Used in **exactly three places**:
1. **Chat dock** (bottom-right floating panel) — `blur(30px)` over `rgba(28,28,30,0.72)`.
2. **iOS sheets** (provider picker, settings detail) — `blur(60px)` over `rgba(44,44,46,0.86)`.
3. **Popovers / context menus** — `blur(20px)` over `rgba(58,58,60,0.92)`.

Everything else is fully opaque. Translucency is a vocabulary, not a default.

### Imagery vibe
The app is text + abstract widgets — there's almost no photographic imagery. Widget previews (a chart, a weather icon, a calendar) use the iOS system color palette. When imagery does appear (a user-pasted screenshot, an `image_slot`), it sits inside a `--radius-lg` card with no border.

### Layout rules
- **Fixed elements:** the chat dock (bottom-right, 24px from edges on desktop; full-width-minus-24 on iOS at bottom). Toolbar on desktop (top of window). iOS tab bar — see "Open questions".
- **Canvas grows.** No max width on desktop. On iOS the canvas pans freely.
- **Single column on iOS, free grid on desktop.** Widgets reflow to a single column ≤ 600px viewport.

---

## Iconography

> **⚠︎ INFERRED — no icon system was specified.** gen-app is Apple-platform-native, so **SF Symbols** is the natural fit — but SF Symbols cannot be embedded on the web. This design system uses **Lucide** (open-source, CDN-available, same stroked aesthetic, same 24px grid) as a 1:1 substitute. When porting back to the Tauri/SwiftUI build, swap each Lucide name for its SF Symbols equivalent (mapping in `assets/iconography.md`).

### Rules
- **Stroke style only.** No filled icons in chrome. (Filled icons may appear inside widgets if the widget content calls for it — e.g. a weather sun.)
- **24×24 nominal box, 1.75px stroke.** Lucide's default. On compact toolbars, render at 20px; on iOS tab bar, at 28px.
- **Color = `--fg2`** at rest, `--fg1` on hover, `--color-accent` when active/selected.
- **Pair icons with text** in every primary navigation slot. Icon-only is reserved for tertiary toolbar actions and is always paired with a tooltip.
- **No emoji as iconography.** Emoji appear *only* when the model outputs them inside chat or widget content.
- **No unicode glyphs as icons.** Arrows in copy (`↓ ↑ ← →`) are typography, not icons.

### Loading
Lucide is loaded from CDN. The kit imports it as a global once per HTML file:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```
Use as `<i data-lucide="message-circle"></i>` then call `lucide.createIcons()`.

### Common icon usage
| Where | Lucide name | SF Symbols equivalent |
| --- | --- | --- |
| Chat dock toggle | `message-circle` | `message` |
| Add widget | `plus` | `plus` |
| Settings | `settings` | `gearshape` |
| Provider | `cpu` | `cpu` |
| Embedding | `network` | `network` |
| Extension | `puzzle` | `puzzlepiece.extension` |
| Logs | `file-text` | `doc.text` |
| Symbol tag | `tag` | `tag` |
| Selected (multi) | `check` | `checkmark` |
| Drag handle | `grip-vertical` | `line.3.horizontal` |
| Close / toss | `x` | `xmark` |
| Retry | `rotate-cw` | `arrow.clockwise` |

---

## Component inventory → Konsta mapping

| gen-app component | Konsta primitive | Notes |
| --- | --- | --- |
| Window chrome (desktop) | *(custom)* | Konsta has no desktop window; we wrap the iOS layout in a `macos_window` frame. |
| App bar / nav | `Navbar` | iOS title-bar style; on desktop, hosted inside the macOS toolbar. |
| Toolbar (desktop top) | `Toolbar` (top variant) | Hosts canvas-mode toggles, multi-select bulk actions. |
| Tab bar (iOS, dock variant B) | `Tabbar` + `TabbarLink` | Canvas / Chat / Settings — only used in iOS dock variant B. |
| Chat dock (floating) | `Card` + `Block` *(custom shell)* | Konsta has no FAB-style dock; we use an elevated Card pinned bottom-right. |
| Provider list row | `ListItem` (`media`, `title`, `after`) | Cell pattern with leading icon + chevron. |
| Inline button | `Button` | `large` variant for primary CTAs; `clear` for tertiary. |
| Segmented (e.g. dock variant) | `Segmented` + `SegmentedButton` | Used in onboarding sample switcher. |
| Text field | `ListInput` | Always inside a `List` (Konsta convention). |
| Toggle switch | `Toggle` | Extensions on/off; settings flags. |
| Radio (provider pick) | `ListItem radio` | One active provider — enforced by radio semantics. |
| Sheet / modal | `Sheet` | Used for provider auth, widget details. iOS uses bottom sheet; desktop uses centered modal (custom wrapper). |
| Popover | `Popover` | Multi-select action menu, widget overflow menu. |
| Toast | `Toast` | Bottom-center on iOS, bottom-right on desktop (above the dock). |
| Progress | `Preloader` (Konsta) | Spinner for loading states. |
| Empty state | `Block` *(custom hero)* | Centered icon + headline + CTA. |
| Widget card | `Card` *(custom content)* | The widget itself is a Konsta Card with header (title + overflow) + body (declarative spec render) + footer (timestamp). |

---

## Open questions & tradeoffs

These were not resolvable from the spec alone. **Three are now answered** based on user feedback; the rest still need your input.

1. **Does the chat dock stay docked on iOS?** ✅ **Answered — Dock A (persistent dock).** The dock stays pinned to the bottom of the iPhone, collapsible. We removed the Tab B variant from the kit.

2. **Multi-select on iOS.** Long-press to enter selection mode (current iOS convention), or a persistent "Select" affordance? Variant A defaults to long-press; this is an inference.

3. **What is a "symbol"?** ✅ **Answered — symbols are widget @-mention handles.** When the user multi-selects N widgets, those widgets become "addressed" — typing in the chat operates on them. Each widget also carries a stable `@symbol` name (e.g. `@market`, `@weather`, `@today`) the model can reference. Patterns:
   - **Address by selection** — select 2 stock widgets, type "what's the trend?" → model rewrites those two widgets. The dock shows an `ADDRESSING @market @market` strip above the composer to make the target explicit.
   - **Address by mention** — type `summarize @market in one sentence` → model resolves `@market` to the matching widgets and reads them.
   - The chip is shown in three places: top-left of each widget card, in the "addressing" strip above the composer, and inline in chat message bodies when mentioned.

4. **Provider switching mid-session.** "Exactly one active for chat" — does switching mid-conversation reset the thread, or does the dock carry context? We assume it carries context but shows a hairline notice ("Switched to Groq").

5. **Onboarding minimum viable.** ✅ **Answered — 4 steps with optional sample.** Welcome → Pick provider → Add key → **Try a sample**. The sample step offers three one-tap widgets (Weather / Stock / Calendar) and a "Skip — take me to the canvas" escape hatch.

6. **Extensions discovery.** The spec mentions toggle on/off in Settings but says nothing about *installing* extensions. We hide install UI for now; existing extensions list as toggles.

7. **Embeddings setup is buried.** We put it in Settings → Senses, not in onboarding. Onboarding doesn't need embeddings to write a widget. If first-run search-over-widgets is critical, embeddings should join the onboarding flow.

---

## Notes on substitutions

- **Font.** SF Pro is Apple's; not licensed for web embed. We use `-apple-system` stack (renders native on Apple devices, falls back to Helvetica Neue elsewhere). **No substitution needed on Apple platforms.**
- **Wordmark display.** **Instrument Serif** (Google Fonts) used for the wordmark italic. If you have a real brand display font, swap the `--font-brand` var.
- **Icons.** Lucide via CDN as a substitute for SF Symbols. **Flagged in the Iconography section above.**
- **Konsta.** We do not bundle Konsta UI in the preview — the UI kit's JSX components are visual recreations using the same class names and DOM structure Konsta produces, so they're drop-in-replaceable when wiring the real app.
