# Changelog

All notable changes to the gen-app design system are recorded here. The format is loosely based on [Keep a Changelog](https://keepachangelog.com), adapted with **Reworked** and **Flagged** sections for design-specific churn. Versions follow design semver — see [README.md § Versioning](README.md#versioning).

## [Unreleased]

_Nothing yet — next change lands here._

---

## [0.4.0] — 2026-05-22

The "Claude Code + AI-authored extensions" release.

### Added
- **Claude Code as a provider.** No API key — uses the locally-installed `claude` CLI via terminal bridge. Shows CLI version + authenticated-user instead of a masked key, with a `Check CLI` button. New **Request budget** sub-section (daily $ ceiling slider, used-today counter) since Claude Code bills by actual usage. Added as the new active default. Onboarding step adapts copy + skips the API-key field for CLI providers.
- **Extension AI authoring flow** (preview). Chat dock scoped to the open file, AI emits structured "Proposed change" cards with mini diffs + Test / Apply / Reject buttons. Slash commands (`/explain` `/refactor` `/test` `/fix` `/schema`), inline `Fix with AI` action on lint errors, per-file conversation history.

---

## [0.3.0] — 2026-05-22

The "make it real" release. Tailwind, themes, extension authoring, and the chat dock graduates from a strip to a chat head.

### Added
- **Theme switching** — Light / Dark / Auto. Full iOS HIG light token set under `[data-theme="light"]`, `prefers-color-scheme` watcher for Auto. New **Settings → Appearance** (iOS: **Looks**) section with a segmented control and a live preview block. Tweaks panel exposes the same picker.
- **Tailwind v4 via CDN** (`tailwind.js` at the project root) — every HTML file can opt in with a single `<script>` tag. CSS variables from `colors_and_type.css` are exposed as Tailwind utilities through `@theme` so `bg-card`, `text-fg2`, `border-hairline`, `bg-accent-tint`, etc. all "just work" and follow theme.
- **Widget ⋯ menu** — opens a popover with **Address in chat**, **Edit @symbol** (inline prompt), **Duplicate**, and destructive **Toss** (removes the widget + drops a "Widget tossed." line in chat).
- **Weather conditions card** — 12 variants (sunny / clear night / partly cloudy / overcast / rain / thunderstorm / snow / fog / wind / hail / heatwave / night cloudy) with mood-tinted backgrounds, animated SVG glyphs (sun pulse, drifting clouds, falling rain, flickering bolt, swaying wind lines), and matching status pills.
- **Stock chart widget** — TradingView `lightweight-charts@4.2.0` with Line / Bars / Candles toggle. Chart styling reads `--color-accent` / `--color-green` / `--color-red` from CSS, so it follows theme.
- **Widget primitives card** — comprehensive showcase the LLM can compose widgets from: typography scale, buttons (5 variants × 3 sizes × 5 states + icon buttons), inputs (text/search/textarea/select/number/date with focus/error/disabled), radio/checkbox/toggle, segmented control, tabs, slider, dropdown menu, progress (linear/indeterminate/ring/skeleton), badges (status pills + notification counts + dot), avatars (round/square/stacked), image holders (empty/filled/loaded), list rows, cards (stat tiles/content/image), feedback states (empty/error/success/info), key-value table, and charts (sparkline/bars/ring/donut/horizontal-bar + TradingView).
- **Extension authoring** — full **ExtensionEditor** mounted from Settings → Extensions. CodeMirror 5 lazy-loaded from CDN (mobile-friendly, ~70kb), JS syntax highlight with the iOS dark palette, line numbers, bracket matching, autoclose. Toolbar: Test · Save · Undo · Redo · Find · Settings. Side panel: Permissions / Bound secrets / Last test output.
- **Secrets manager** — new top-level **Settings → Secrets** section (iOS: **Vault**). Lists keychain entries with scope pills (global / extension / constant / unused), per-row reveal/copy/trash, "Add secret" modal with name (uppercased mono), value (password with reveal toggle), scope segmented control.
- **Extension manifest schema** (`extension-manifest.d.ts`) — TypeScript types for `ExtensionManifest`, `ExtensionContext`, `WidgetPayload`. Documents the sandbox surface: `widget`, `secrets` (only declared names), `fetch` (network allowlist), `storage`, `emit`, `log`, `signal`.
- **Messenger-style chat head** — when collapsed, the dock becomes a circular 56×56 gradient FAB with sparkles glyph and a red badge for `addressed` count. Spring pop-in animation; click expands back to the full dock.
- **iOS header bar** — Canvas screen now has a proper iOS title bar (`Canvas` title + ⚙ gear) instead of a free-floating FAB sitting over the widget grid.
- **Lucide chevron icons** on the dock head — replaces unicode arrows for the open/close indicator.

### Reworked
- **All preview cards** converted to Tailwind utilities + design-token CSS vars. Same visual output, much less per-file boilerplate.
- **Surfaces preview card** — shows the four surface levels (`base → window → card → elevated`) in real use: a stock widget + weather widget sitting inside a window, with a floating popover. Legend kept on the right.
- **Foreground preview card** — each `fg1`–`fg4` shown in actual usage (price = fg1, AAPL secondary = fg2, placeholder = fg3, ⋯ glyph = fg4), with accent + green for context.
- **README.md** open-questions section — answered #1 (dock A locked), #3 (symbols are @-mentions, 3 addressing patterns documented), #5 (4-step onboarding with sample picker).

### Flagged
- iOS multi-select gesture still inferred (long-press vs persistent affordance) — open question 2.
- Provider mid-session context behavior still inferred — open question 4.
- Extensions install / discovery UX deferred — open question 6.
- Embeddings still buried in Settings — open question 7.

---

## [0.2.0] — 2026-05-21

The "answers" release. User feedback resolved the biggest design ambiguities.

### Added
- **Settings page** — full four-section build: **Providers** (active radio, key field, model row), **Embeddings** (local llama.cpp / remote OpenAI segmented + model details), **Extensions** (6 toggleable workers with version badges), **Logs** (color-coded info/warn/error stream). Desktop uses a split sheet (sidebar + detail), iOS uses a nav stack with back navigation.
- **iOS playful section names** — Brains / Senses / Powers / Diaries on iOS; conventional names on desktop for scannability.
- **Settings preview cards** — one per section (Providers / Extensions / Logs / iOS root).
- **Symbols as @-mention handles** — every widget carries a stable `@symbol`. Three addressing patterns: (1) select widgets → dock shows ADDRESSING strip, (2) type `@symbol` in chat (renders as inline chip), (3) tags can be shared across widgets (multiple stocks → one `@market`).
- **Sample-widget onboarding step** — 4th step offers Weather / AAPL / Calendar one-taps with a "Skip — take me to the canvas" escape.

### Reworked
- **Tags preview card** rebuilt to show the symbol-as-mention model end-to-end (mini canvas + mini dock with addressing strip + inline chip in message bubble).
- **Open questions** in README — answered three; the rest stay marked as inferred.

### Removed
- **iOS dock variant B** (tab-style chat) and the variant toggle in Tweaks. Dock A (persistent chat head) is now the default and only iOS chat surface.

---

## [0.1.0] — 2026-05-21

Initial system. Built from the product spec only (no codebase or Figma attached).

### Added
- **Foundations** — `colors_and_type.css` with surface stack (`base → window → card → elevated`), accent + iOS systemX palette, 4-level foreground hierarchy, hairline/soft/focus strokes, status tints, iOS HIG type scale (11→44px), 4pt spacing grid, continuous-corner radius scale (4→28 + pill), shadow scale (`elev-0 → elev-4`), motion easing (standard / emphasized / spring) + durations, three vibrancy blur levels.
- **Placeholder brand assets** — `logo-wordmark.svg`, `logo-mark.svg` (gradient), `logo-mark-mono.svg`. Wordmark uses Instrument Serif italic loaded from Google Fonts. **Flagged as placeholder.**
- **Preview cards** — atomic specimens for every token cluster: colors (surfaces / accent / foreground / status / pills), type (display / body / brand / mono / weights), spacing (scale / radii / shadows / motion / blur), components (buttons / inputs / list / segmented + toggle / tags-as-symbols / widgets / dock / sheet / empty), brand (wordmark / mark / iconography / voice / principles), and a journey flow card.
- **UI kit** — `ui_kits/gen-app/` with: `Frames.jsx` (macOS window chrome + iPhone bezel), `Primitives.jsx` (Button / ListRow / Toggle / Segmented), `Widget.jsx` (Stock / Weather / Calendar / Pending), `ChatDock.jsx` (vibrancy blur, addressing strip, inline mentions), `Canvas.jsx` (widget grid + empty hero + fullscreen chat variant), `Onboarding.jsx` (welcome → provider → key), `Icon.jsx` (Lucide wrapper), `App.jsx` (state machine + Tweaks wiring).
- **Click-thru UI kit** at `ui_kits/gen-app/index.html` — desktop window + iPhone side-by-side, sharing canvas + chat state.
- **Iconography** — Lucide standing in for SF Symbols, with `assets/iconography.md` mapping each Lucide name back to its SF Symbols equivalent for handoff to the real Tauri app.
- **Voice + visual foundations** — README sections documenting playful tone (sentence case, verbs on buttons, em dashes), surface/blur usage rules, hover/press patterns, layout fixed-element rules.
- **Five design principles** — codified in README + a preview card.
- **`SKILL.md`** — Agent Skills-compatible entry so the system can be invoked as a skill.

### Flagged
- No codebase or Figma attached — every visual decision is inferred. Marked with **⚠︎ INFERRED** in README.
- Logo is placeholder.
- Lucide substituted for SF Symbols (web-embed limitation).
- Two iOS dock variants shipped pending user decision (Dock A / Tab B).
- Multi-select gesture, provider context behavior, extension discovery, embeddings placement all flagged as open questions.
