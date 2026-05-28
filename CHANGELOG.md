# Changelog

All notable changes to the gen-app design system are recorded here. The format is loosely based on [Keep a Changelog](https://keepachangelog.com), adapted with **Reworked** and **Flagged** sections for design-specific churn. Versions follow design semver — see [README.md § Versioning](README.md#versioning).

## [Unreleased]

_Nothing yet — next change lands here._

---

## [0.7.0] — 2026-05-28

The "deno sandbox" release. Phase 1 of the `phase1/edge-extensions` branch landed a second extension sandbox — a long-lived `deno run` subprocess per extension, alongside the legacy Web Worker. The design system follows: a new runtime chip orthogonal to the kind chip, process-state on every deno row, and a runtime detail sheet that codifies the lifecycle/network/log triad. Bundled clock + weather both ship in deno flavour now; the iOS fallback path stays worker-only.

### Added
- **Runtime chip.** New 9.5px mono pill orthogonal to the existing kind chip — `worker` (gray, in-webview, iOS-safe) or `deno` (green, subprocess sandbox, desktop). Pairs with the kind chip on every Extensions row in the order *kind → runtime*. Documented in README § Extension runtimes; the existing kind-chip vocabulary is preserved (it keeps carrying authorship).
- **Process-status dot.** 7px circle next to the runtime chip on every deno row: green pulse = running, gray = idle, faded = stopped, red = crashed / backoff. Re-used inside the runtime detail sheet and surfaceable in the Logs viewer. CSS keyframe `pulse` lives in the previews; promote to a token when a second consumer lands.
- **Runtime detail sheet** — new preview `extension-runtime-detail.html`. Drill-in from a deno row: header + status strip (pid · uptime · Restart · Stop) + a two-column **Runtime / Resources** read-out (spec, port, idle stop, cold start, restart count · memory bar, disk bar, data-dir path) + lifecycle controls (idle-stop slider, hot-reload toggle, memory-ceiling segmented `128 / 256 / 512 / 1024 MB`) + network-allowlist read-out (host pills mirroring `manifest.permissions.network`) + recent stderr feed (mono, last 5 lines, info/warn/err colored). Three small **state cards** below cover idle / backing-off / stopped variants. iOS side shows the soft-disabled "Runs on Mac only" rationale block (App Store 2.5.2) with two alternatives (remote MCP / re-author as worker) and a last-cached-data line so the widget doesn't go blank on iPhone.
- **Allowlist host pill.** 10.5px mono pill on a neutral background, one per entry in `manifest.permissions.network`. Read-only in the runtime detail; this is what the host's per-extension HTTPS proxy enforces.
- **`runtime: 'deno'` vocabulary throughout copy.** Section names and tooltips spell the runtime explicitly: "runs on Mac only", "deno · v2.1.0", "deno cache warm · 38ms". Numbers in copy quote the literals from `ext_runtime.rs` (`MAX_CONCURRENT = 16`, disabled after 5 crashes, 2s SIGTERM grace, default 5-min idle stop) — keep them in sync.

### Reworked
- **`settings-extensions.html`** — every row now carries both chips (kind + runtime); bundled `Open-Meteo` and `Clock` flip to `deno · running` to reflect the new bundled-deno install (`BUNDLED_DENO_EXTENSIONS` + `extInstall` on app launch). A new **user · deno** row (Notes index · PGlite · 14 MB · idle) demonstrates the user-authored deno path. iOS panel now soft-disables both bundled deno rows with a "runs on Mac only" caption; "5 installed · 4 enabled" → "6 installed · 5 enabled · 3 on deno". Header copy reframed to "Three kinds of extension, two runtimes, one list".
- **README** — new **Extension runtimes** section between Iconography and Component inventory; component inventory grows four atoms (runtime chip, process-status dot, runtime detail sheet, allowlist host pill); answered open question 6 gains the runtime-chip distinction; two new open questions added (8: deno authoring entry point; 9: bundle weight).
- **SKILL.md** — version bumped, runtimes flagged in "What's flagged" so authors don't accidentally suggest `runtime: 'deno'` to iOS-targeting users.

### Flagged
- **Deno authoring CTA.** The Developer panel covers spawn/bind/respond/SIGTERM diagnostics, but there's no first-class "New deno extension" template flow yet. Until that ships, the **+ New extension** CTA in `settings-extensions.html` continues to default to `worker`. README open question 8 tracks this.
- **Bundle weight.** Shipping `deno` for both archs grows the `.app` by ~240 MB; universal lipo-join roughly halves it. Decision is release engineering's, not design's, but the runtime detail copy assumes a single shipped binary today. README open question 9 tracks this.
- **`worker` deprecation timeline.** With deno covering everything desktop, the worker runtime survives only for iOS and legacy single-file user extensions. We are NOT marking `worker` rows as "legacy" in the UI yet — flagging the second-class status before iOS deno is impossible is a footgun. Re-evaluate once user-authored deno authoring is real.
- **MCP × runtime chip interaction.** Today MCP rows show only the kind chip (`npm · stdio` / `http · oauth`) — adding a `runtime: child-process` chip would be redundant. Left as-is; revisit if a fourth MCP transport lands.

---

## [0.6.0] — 2026-05-23

The "MCP as extensions" release. The Tauri app had drifted past the system on three big surfaces — MCP install + auth, per-provider spend, HuggingFace model picking, canvas archives, and the manual glue editor — this version closes all of it.

### Added
- **Install MCP server — wizard.** New preview `install-mcp-sheet.html`. A multi-step sheet with a transport segmented (`stdio (npm)` / `Remote (HTTP)`), per-transport bodies (npm package + args + env-secret lines, or endpoint URL + Probe), an auth segmented (`None` / `Bearer` / `OAuth`), and an installed-summary terminal state listing the synthesized providers. Codifies the **multi-step config sheet** pattern — segmented header → per-step body → terminal state.
- **MCP auth picker.** New preview `mcp-auth-picker.html` covering all six runtime states: `none`, `bearer` (token-from-secret), `oauth` × 4 states (authorized HTTP, authorized stdio + env-var bridge, in-progress browser handoff, denied). Adds the **auth-status row** atom — small Lucide shield variant + issuer + scopes/footnote. Green / orange / red carry authorized / in-progress / failed.
- **MCP tools sheet.** New preview `mcp-tools-sheet.html` — drill-in from an MCP row, lists every synthesized provider as a card with name + description + pretty-printed JSON-Schema input. The **spec viewer** block (`pre.spec` with cyan keys, green strings, orange numbers, italic comments) is now a reusable atom — same one carries Glue's "Live spec" tab and any future schema view.
- **Per-provider spend ceiling + gate-error states.** `settings-providers.html` reworked: the 0.4.0 "Request budget" sub-section is now a list with one row per provider, each showing exact-vs-estimated USD, a thin progress bar, and a red "at ceiling" state when `checkBudgetGate` refuses. Adds two new dock states next to it — **rate-limited composer** (send button → countdown chip) and **budget-refused error** (inline orange info row in the chat, never a modal, always offers two next steps).
- **Local model picker (HuggingFace).** New preview `model-picker-modal.html`. Three states side by side: empty hero ("no model on disk"), HuggingFace search (repo cards with per-file quant chips q4/q5/q6/q8/f16), and on-disk list with the active model. Adds the canonical **long-running progress row** atom — filename + quant chip + percent + Cancel on row 1, 4px bar in row 2, mono "current / total · rate · ETA" in row 3. Reusable for MCP `npx` warm-up, canvas zip imports, anything streamed.
- **Logs source filter + Export .zip.** `settings-logs.html` reworked: source-toggle chips (`all` / `harness` / `mcp` / `glue` / `canvas` / `logs` / `app`) with per-source counts above the stream, plus an **Export .zip** action that bundles `events.json` + `events.ndjson` + an env-snapshot `meta.json`. Sample event lines for every subsystem so the visual rhythm is documented (MCP child spawn, glue runtime mount, harness rate-limit warn, MCP child exit error → respawn).
- **Canvas export / import.** New preview `canvas-archive.html`. Replaces the 0.4.1 "Export transcript (stub)" with three things: dock `⋯` menu rework (Export canvas… / Import canvas…), zip anatomy card (`canvas.json` + `extensions/<id>.js` + `meta.json`), and an **import-resolution sheet** grouping incoming items into three states — green "will re-install / already installed", orange "needs your attention" (MCP re-auth) — plus an inline conflict-resolution footnote ("A canvas named X already exists. We'll create …"). Codifies the rule: **never block import**; degraded items stay degraded until the user resolves them inline.
- **Glue editor — manual mode.** New preview `glue-editor-manual.html`. Counterpart to `glue-ai-authoring.html`: same chrome (breadcrumb, meta header, tab strip), but the right pane swaps the chat dock for a **live preview** running in a parallel `GlueWidgetRuntime`. Adds the **props bar** above the preview (lets users feed sample inputs without touching source) and the "Ask AI" toggle that pivots back to the AI mode.
- **Extension kind chips.** `settings-extensions.html` reworked: every row now carries a kind chip — `bundled` (gray-outlined), `user` (purple tint), `npm · stdio` (orange tint), `http · oauth` (accent tint) — and per-kind trailing affordances (pencil for user, list-tree + more for MCP, nothing for bundled). Adds "+ New extension" + "+ Install MCP server" CTAs in the header.

### Reworked
- **`settings-extensions.html`** — kind chips + install CTAs + iOS section split (remote MCPs work everywhere, stdio shows soft-disabled with the App Store 2.5.2 rationale visible).
- **`settings-providers.html`** — per-provider spend ceiling table replaces single-provider sub-section; throttle + budget states added.
- **`settings-logs.html`** — source-toggle chips, Export .zip, expanded event vocabulary (MCP / glue / canvas).
- **Dock `⋯` menu** — `Export canvas` / `Import canvas` promoted; `Export transcript` demoted below a divider with an explicit `.md` hint.

### Flagged
- **iOS stdio MCP** soft-disable is shipped but the longer-term answer (remote-MCP-only on iOS? prompt-to-install-on-desktop deep link?) is still open.
- **Conflict resolution on import** — current pattern auto-creates a renamed canvas. A "Replace existing" affordance was deliberately omitted; reconsider once import is in real use.
- **Re-render on ⌘S** for the manual glue editor matches the AI flow's apply-then-render rhythm. If users want continuous reload, the props bar can grow a "live" toggle later — not added speculatively.

---

## [0.5.0] — 2026-05-23

The "author your widget" release. Every widget now exposes its source and routes into an AI-powered editor for both its glue and its extensions.

### Added
- **View widget source.** Every widget's ⋯ menu has a new **View source** option that opens a sheet with three tabs: **Glue** (the small React app that wires extensions to UI components — the prominent default), **Extensions** (one or many data sources the glue depends on, expandable to view each extension's `.js`), and **Live spec** (the actual JSON payload). Examples show `@weather` (1 extension), `@market` (2 extensions — quote + history), `@today` (3 extensions — macOS Calendar + Google Calendar + Reminders). Includes copy-to-clipboard, Escape-to-close, and an **Open in editor** primary CTA.
- **Glue editor AI authoring flow.** Clicking **Open in editor** on the Glue tab routes into a Cursor-style editor scoped to the widget's `glue.jsx`. Same mental model as the extension authoring flow: a chat dock scoped to the file, structured "Proposed change" cards with diffs + Preview / Apply / Reject, slash commands (`/explain` `/refactor` `/preview` `/add-extension` `/components`). The AI can install new extensions mid-conversation (shown as a `Will install · hacker-news v0.1.0` chip) and a sandbox preview renders the proposed widget inline before you apply.
- **Rename canvas on iOS.** Canvas dropdown now includes `Rename "..."` (pencil icon) and `Delete "..."` (red, only when ≥ 2 canvases). Each shows the current name inline so it's obvious which one will be affected.

### Reworked
- Desktop canvas tabs get a `title` tooltip ("Double-click to rename") so the rename affordance is discoverable on hover.

---

## [0.4.1] — 2026-05-22

Patch on 0.4.0 — workspace + session ergonomics.

### Added
- **Multiple canvases.** Every canvas has its own widgets and chat history. Switching canvases swaps both simultaneously. Desktop shows a **canvas tab strip** under the toolbar (click to switch, double-click to rename, × on active tab to delete — minimum one canvas always survives, `+` to create). iOS shows a **dropdown title** in the header — tap the canvas name to see the list with `✓` next to the active one and a `+ New canvas` action.
- **Dock `⋯` menu** — **New session** (accent, with `⌘⏎` hint), **Clear chat** (with msg count), **Export transcript** (stub), **Session history** (with count badge).
- **New session** — archives the current chat into history (only if it has content) and starts a fresh thread with a `New session — HH:MM` system marker.
- **Session history sheet** — slides up inside the dock with one row per archived session (first user message as the name, relative timestamp, msg count). Click to restore (current chat is parked into history first so nothing is lost). Trash per row deletes a session.
- **Reset everything** Tweak button (replaces "Reset canvas + chat") drops all canvases back to one empty.
- **New canvas Tweak** button to make the multi-canvas behaviour discoverable.

### Reworked
- `useChatCanvas` → `useCanvases` — same active-canvas surface plus canvas-level ops (`newCanvas`, `renameCanvas`, `deleteCanvas`, `setActiveId`, `clearChat`, `newSession`, `restoreSession`, `deleteSession`, `resetAll`).
- Dock header layout — title and chevron preserved, `⋯` slotted between them, only the icon + title trigger collapse so the menu button doesn't accidentally toggle. Header now shows the active canvas name as context (`Chat · Trading · addressing 2`).

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
