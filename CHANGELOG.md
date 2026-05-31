# Changelog

All notable changes to the gen-app design system are recorded here. The format is loosely based on [Keep a Changelog](https://keepachangelog.com), adapted with **Reworked** and **Flagged** sections for design-specific churn. Versions follow design semver — see [README.md § Versioning](README.md#versioning).

## [Unreleased]

_Nothing yet — next change lands here._

---

## [0.8.1] — 2026-05-31

App widgets gain an **options menu**. Patch over 0.8.0.

### Added
- **App options on the served-by hairline.** The `appview-origin` strip (the `iframe · 127.0.0.1 · <ext> · sandboxed` line at the top of a full-bleed app) now carries a **⋯** at its right end. It opens an `AppOptionsMenu` headed by the app's icon + name + extension id, with **Reload app · View source · Open in editor · Permissions — Close app** (`⌘⌫`). Placement was chosen over the app-tab and window-toolbar alternatives (explored in `App Options Placement.html`): the hairline already names the backing extension, so a source/options menu reads naturally there, right where the extension identity lives.
- **`AppOptionsMenu`** + **`AppReloading`** in `AppWidget.jsx`. *Reload app* swaps the body for a brief "restarting extension…" shimmer (`appview-spin`) so the action reads as real; *Close app* exits to the grid. Menu closes on outside-click and when the active app changes.
- **Styles** in `styles.css` — `.appview-opts` (+ `.on`), `.appopts-menu` / `.appopts-head` / `.appopts-row` / `.appopts-sep`, and the `appview-spin` keyframe.

### Changed
- `AppView` takes an `onClose` prop (threaded from `App.jsx` → `lane.closeApp`) so the menu's Close lands back on the widget grid.
- Version lines → `0.8.1` (README ×2, SKILL front-matter, iOS settings root + About row).

### Flagged
- View source / Open in editor / Permissions are **menu stubs** — they don't yet open the per-kind source sheet, the editor, or the permission inspector. Wiring them to real surfaces is the follow-up (those surfaces were explored earlier in `App Widgets.html` but aren't in the kit).
- Hairline placement means options are reachable only while an app is **open**; a backgrounded app (inactive tab) has no ⋯. Acceptable for now since options act on the *current* app, but revisit if per-tab actions (e.g. close-from-tab) are wanted.

### Exploration (mockups, not shipped)
- **`App Options Placement.html`** — the three-way comparison (app tab · served-by hairline · window toolbar) the placement decision came out of.

---

## [0.8.0] — 2026-05-30

The **app-widgets** release. Phase 1's `bigger-picture` branch (ADR 0006) scales the widget substrate to app-sized artifacts: a third widget kind that, unlike a declarative or glue widget, is **never a card in the grid — it takes the whole canvas**. Apps are peers of canvases in the tab strip. Explored across `App Widgets.html`, the core surfaces are now wired into the kit.

### Added
- **`AppWidget.jsx`** (new file) — the whole app-widget substrate for the click-thru:
  - **`useAppLane()`** — the lane state machine. Holds `apps` in **recent-first** order, the `activeAppId` (null = a canvas is active), and a `launchedOver` flag for an ephemeral session. `openApp(id)` moves an app to the front and activates it; `openApp(id, { ephemeral: true })` opens it as a session over the current canvas; `closeApp` / `keepAsTab` / `newApp(spec?)` round it out. Seeds four apps (Workouts · calendar, Projects · kanban, Notes, Reading) so overflow + recency are demoable out of the box.
  - **`LaneTabs`** — canvas tabs and app tabs in **one shared lane**, told apart by shape: canvas tabs are pills with an outline `layout-grid` glyph; app tabs carry a coloured **app-icon squircle** (`AppGlyph`) + name + a green running dot. Only `LANE_MAX_INLINE_APPS` (3) fit inline; the rest collapse into a **⌄ overflow menu** (recent-first, opening one promotes it to the front and slides the oldest into overflow). The trailing **+** opens a **New** menu — *New canvas* / *New app*.
  - **`AppView`** — the full-bleed app body that replaces the widget grid when an app tab is active. Carries the served-by-extension hairline (`iframe · 127.0.0.1 · <ext>` + `sandboxed`), and — when `launchedOver` — a **Back to grid** pill (`esc`) plus a **Keep as tab** promote button. The floating chat dock stays mounted over it.
  - **On-brand app contents** — `AppCalendar` (month grid), `AppKanban` (board), `AppNotes` (list + detail), all built from tokens only. Mapped through `APP_VIEWS` by each app's `view`.
- **App-widget styles** in `styles.css` — `.lane-divider`, `.app-tab` (+ `.on`), `.app-dot`, `.lane-of` overflow chip, `.lane-menu` (+ head / row / `row-lg` / sep / ic), and the `.appview` block (origin hairline, body, `appview-pill` left/right, `appview-kbd`). Anchored to the existing `.canvas-tabs` row and `.mac-content`.
- **Tweaks → App widgets** — Open Workouts app · Launch Projects over canvas (ephemeral) · New app · Back to grid, so the substrate is reachable without the host.

### Reworked
- **`App.jsx` desktop frame.** The root mounts `useAppLane()` and threads it into `DesktopApp`. The desktop tab strip swaps `CanvasTabs` → **`LaneTabs`** (canvas tabs gain the grid glyph; app tabs join the lane). The content area now renders **`AppView` when an app tab is active, the widget `Canvas` otherwise** — switching to any canvas tab calls `closeApp` first, so an app and a grid are never shown at once. The chat dock's `contextLabel` follows the active app's name.
- **`index.html` load order** — `AppWidget.jsx` loads right after `Canvas.jsx` (needs `Icon`, used by `App.jsx`).
- **Version lines** — `README` (current + versioning), `SKILL.md` front-matter, and the iOS settings root + About row all move to `0.8.0`.

### Flagged
- **Desktop only.** App mode is wired into the desktop frame; the iPhone frame still shows the widget grid for every canvas. The iOS presentation of a full-bleed app (and whether app tabs even belong in the iOS canvas dropdown) is unbuilt — same desktop-first staging as the deno runtime in 0.7.0.
- **Overflow cutoff is a fixed count, not measured.** `LANE_MAX_INLINE_APPS = 3` stands in for a real width measurement. A production lane measures available px and reflows; the kit fakes it so the overflow + recency behaviour is visible with the four seed apps.
- **App contents are static mocks.** `AppCalendar` / `AppKanban` / `AppNotes` are themed stand-ins for what a real extension serves into the loopback iframe — there's no bridge, no subprocess, no token broadcast across an iframe boundary. The served-by hairline documents the contract; it doesn't run it.
- **No `New app` authoring flow.** The **+ → New app** menu and `newApp()` drop a pre-seeded app straight onto the lane; they don't run the splash → `propose_extension_change` → mount sequence from `App Widgets.html`. Wiring it through the existing `useAuthoring()` loop is the obvious next step.
- **Launch vs Open, View source, permissions, dev-MCP debugging** — the Settings → Apps tab, the per-kind view-source sheet, the cross-extension permission prompt, and the bridge-log / subprocess debugging surfaces were explored in earlier passes of `App Widgets.html` but are **not** in this cut. They remain component-file-ready for a follow-up.

### Exploration (mockups, not shipped)
- **`App Widgets.html`** — the design-canvas the substrate was worked out on (final cut: the canvas-vs-app model · both canvas-mode states · the shared-lane controls · the new-app flow · launch & discovery). Key corrections that shaped the wiring: an app is **never a grid card** (it owns the canvas); canvases and apps share **one lane** disambiguated by shape; "Back to grid" only belongs to an app **launched over** a canvas, not to an app that is its **own tab**; and the lane is width-bound, so overflow + recent-first ordering are first-class.

---

## [0.7.2] — 2026-05-29

Live-authoring release. Wires the in-app code editor that appears **while the agent is writing an extension** straight into the kit — the feature explored across `Live Editor Mockups.html` is now a working surface on the desktop canvas. The headline decision held: the editor is a **floating overlay**, never a layout column — it must not reflow the canvas or the bottom-right chat dock.

### Added
- **`LiveAuthoring.jsx`** (new file) — the whole feature, ~480 lines:
  - **Persisted setting** — `getLiveCodingMode` / `setLiveCodingMode` / `useLiveCodingMode` backed by `localStorage["genapp-livecoding"]` + a `genapp-livecoding` custom event (mirrors the theme-persistence pattern). Shape: `{ display: "pill" | "float" | "focus", pauseOnRead, autoClose }`, default `float`.
  - **`useAuthoring()` state machine** — `start(spec, onApply)` seeds a session and streams each file's content in char-by-char (13 chars / 24 ms) across the folder's file `order`, advancing tab-to-tab, then flips `status: "done"`. Exposes `pause` / `resume` / `setView` / `setActive` / `close` / `apply`.
  - **`LiveAuthoringOverlay`** — three presentations driven by `display`: a **floating editor card** (anchored top-left over a dimmed canvas, clear of the dock), a **focus sheet** (centred, larger, heavier scrim), and a **minimized pill** (bottom-left, no scrim, determinate progress bar + file counter so you can watch the widget fill in). Header carries grip handle + `extensions/<id>/` breadcrumb + runtime chip + Pause/Resume · Minimize · Float↔Focus · Close; file tab strip with `new` badges + a pulse on the file being written; green "Agent is writing… · tool: propose_change" status row that flips to "Authored N files · ready to install"; footer Reject all / Apply & install (enabled only when done). Esc closes; clicking the float scrim minimizes.
  - **Lightweight streaming highlighter** — regex tokenizer (keywords / strings / numbers / comments) rendering into `<span>`s with a blinking caret, instead of mounting CodeMirror per keystroke (read-only stream, so far cheaper).
  - **Two extension seeds + `matchExtension(text)`** — `HN_EXT` (hacker-news worker extension: `manifest.json` + `src/index.js`, produces a 5-row Hacker News list widget) and `RSS_EXT`; the matcher fires on "hacker news"/"hn", "rss"/"feed", or "…extension" + a create verb.
  - **`LiveCodingPanel`** — the Settings → Developer panel: three radio modes (Stay minimized / Float / Open and focus) + two toggles (Pause when reading / Auto-close on turn end), all writing through `setLiveCodingMode`, plus a "try it" hint.
- **`ListWidget` (kind `list`)** in `Widget.jsx` — numbered rows with title + mono meta line; registered in the `Widget` kind map and on `window`. Lets the authored Hacker News extension produce a real, rendered canvas widget instead of a stub.
- **Developer section** in `Settings.jsx` `SECTIONS` — cyan `code-2` icon, hosts `window.LiveCodingPanel`, shows on both desktop split-sheet and iOS nav-stack.
- **`.la-*` styles** in `styles.css` — scrim (float + focus variants), floating card (with `pop` keyframe) and focus variant, header, tab strip, status row, streaming code block (`la-kw`/`la-str`/`la-num`/`la-cmt` + blinking `la-caret`), footer, minimized pill (`la-pill` with progress bar), and a shared pulsing `la-dot`. All anchored to `.mac-content` (already `position: relative`), so the overlay stays inside the desktop frame and never covers the iPhone.

### Reworked
- **`App.jsx` desktop send path.** `useCanvases` gained `pushUser` / `pushAgent` / `addWidget` (direct chat + canvas writes outside the `routePrompt` flow). The root mounts `useAuthoring()` and wraps desktop send: a prompt that `matchExtension` recognises (and isn't addressing existing widgets) now pushes the user line + an agent "Drafting…" line and kicks off `authoring.start(...)`; on **Apply & install** the widget is added to the canvas and an "Installed …" line is posted. Non-matching prompts fall through to the normal chat path untouched. `DesktopApp` takes `onSend` + `authoring` and renders `<LiveAuthoringOverlay>` inside its frame. A Tweaks button — "Author HN extension (live)" — triggers the flow without typing.
- **`index.html` load order** — `LiveAuthoring.jsx` loads after `SecretsAndExtensions.jsx` and before `Settings.jsx`, so `window.LiveCodingPanel` exists when `SECTIONS` is evaluated.

### Flagged
- **Lightest mode is a pill, not an in-chat chip.** The exploration's "Show a chip in chat" mode would need a custom chat-message renderer to make a transcript chip clickable; the wired version uses the minimized **pill** as the lightweight handle instead (reuses the 2b exploration). The setting option is relabelled "Stay minimized (pill)". Building the true in-chat clickable chip is still open.
- **Streaming is simulated.** The editor types the seed file content on a timer — there's no real model/tool loop. Pause/Resume gate the timer; `pauseOnRead` is stored but not yet wired to scroll/focus detection; `autoClose` is wired (dismisses on done unless in focus mode).
- **Desktop only.** The overlay is not rendered on the iPhone frame — the iOS bottom-sheet presentation from the mockups is still unbuilt. iOS chat keeps the normal path.
- **Dock-to-side / Pop-out not carried over.** The mockup's dock-to-side and pop-out-to-window affordances are not in the wired header (only Pause · Minimize · Float↔Focus · Close). Pop-out to a real Tauri window remains a flagged idea.
- **`matchExtension` is keyword-based.** Two seeds (HN, RSS) and a coarse regex; a real build resolves this from the model's actual `propose_change` tool calls.

### Exploration (mockups, not shipped)
- **`Live Editor Mockups.html`** — the five-scene canvas the feature was designed in (setting · chip-in-chat · floating editor · minimized pill · iOS bottom sheet). Two corrections landed during exploration: the chat dock was redrawn as the real floating `320×380` bottom-right card (not a full-height rail), and the editor was reframed from a canvas-crushing side column to a floating overlay.
- **`Folder Editor Polish.html`** — layout diagnosis (Today / Tight / Nested tree) + the library shortlist behind `react-arborist` + `@uiw/react-codemirror`.
- **`Folder Editor with AI Panel.html`** — the Ask AI panel exploration (open + collapsed rail) that became `AskAIPanel` / `CollapsedAIRail` in 0.7.1.
- **`Extension System Mockups v2.html`** — the four-option follow-up (runtime chooser · worker iOS hint · MCP × runtime chip · About) folded into 0.7.1.

---

## [0.7.1] — 2026-05-28

UI kit patch. The kit's `ExtensionEditor` was a single-textarea CodeMirror 5 surface stuck on the old `manifest.refresh + async function run(ctx)` schema — out of sync with the 0.7.0 folder-and-runtime model. This bump rebuilds it around `react-arborist` for the tree and `@uiw/react-codemirror` for the editor, wires the Settings extensions list to the new chip vocabulary, and adds the **Ask AI** side panel + collapsed rail behind the same surface so the agent's authoring flow has a place to live in the kit.

### Added
- **Folder-aware `ExtensionEditor`** (`ui_kits/gen-app/SecretsAndExtensions.jsx`). Two seed trees per runtime — `SEED_TREE_DENO` (`manifest.json` + `index.ts` + `deno.json`, with `deno.json` read-only) and `SEED_TREE_WORKER` (`manifest.json` + `src/index.js` + `src/lib/hn.js`, to show worker extensions can span folders too). Slim breadcrumb header (`extensions / <name> /`) + runtime chip; left rail uses `react-arborist@3` with 26-px rows, accent left-border on the active file, orange dirty dot, lock glyph on read-only files; editor pane uses `@uiw/react-codemirror@4` with `oneDark` theme and per-extension language packs (`@codemirror/lang-javascript` auto-detects TS/JSX, `@codemirror/lang-json`); accent status bar at the bottom shows `draft · N files · M lines · K modified · {active path} · LF`.
- **Library loader** (`ui_kits/gen-app/index.html`). Pulls `react-arborist@3` + `@uiw/react-codemirror@4` + the two language packs + `oneDark` from esm.sh via a module `<script>`, exposes them on `window.ReactArborist` / `window.ReactCodeMirror`, fires `extlibs-ready`. Three shim files (`react-shim.mjs`, `react-dom-shim.mjs`, `react-jsx-runtime-shim.mjs`) re-export the UMD React + ReactDOM already on `window`; an importmap routes the libraries' `react` / `react-dom` / `react/jsx-runtime` imports through them so there's only one React instance.
- **`AskAIPanel` + `CollapsedAIRail`** inside the editor. AI panel is 360 px: sparkles + "Ask AI" + `sonnet ▾` model picker + collapse, a scope strip auto-built from `Object.keys(files)` with a pulsing dot on the active file, a chat thread carrying user → agent → `propose_change` tool-call row → green diff card with `Preview / Reject / Apply` → follow-up bubble + slash-command hints (`/explain /refactor /test /add-provider /preview`) + composer (`@`-prefix · input · `Stop` · accent send). Collapsed variant is a 40-px rail with the re-open sparkles button + vertical "Ask AI" label + a circular pull-request glyph carrying an orange `1` badge for the unread proposed change. Toggle lives on the existing **Ask AI** header button — switches to a tinted/pressed state when the panel is open.
- **`RuntimeChip` / `StatusDot` atoms** inline in `Settings.jsx`. Mono pill (`worker` gray / `deno` green / `child` indigo) + pulsing 7-px dot. Used on bundled rows, user rows, stdio MCP rows, and inside the runtime detail in About.
- **`RuntimeChooserSheet`**. Two big rows (Worker / Deno) with runtime chip + description + chevron; opens before the editor when `+ New extension` is clicked. Matches `apps/desktop/src/settings/RuntimeChooserSheet.tsx` from the repo.
- **About panel + open-source licenses** in `Settings.jsx`. New section in the Settings sidebar (indigo icon, "About" on desktop, "About" on iOS). Identity card (version + channel + update status + release notes link), Runtime card (Deno chip + arch + Tauri / llama.cpp / Claude CLI versions), Data card (App data + Extensions cache + Logs with folder buttons + Log `Export .zip`), **Open-source licenses** list (8 packages: Deno · Tauri · React · llama.cpp · Lucide · Konsta · SQLite · Diesel, with license badges + repo + external-link, plus a footer link to `THIRD_PARTY_NOTICES.md`), footer actions (`Check for updates`, `Copy diagnostics`, `© 2026 · MIT`).

### Reworked
- **`extension-manifest.d.ts`** rewritten against the actual SDK shape: `runtime: 'worker' | 'deno'` discriminator, `entry`, `ports`, `databases`, `lifecycle`, separate `WorkerProviderContext` and `DenoExtensionContext`, `ProviderManifest` (with `route` for deno), `WidgetSpec` + `bindings`. Worker block now correctly describes "a folder of one or more JS files bundled into a single ESM module by esbuild at install time" (the previous wording said "single .js file"). Three examples: worker user extension, deno bundled extension, deno entry file via `startExtension`.
- **`Settings.jsx`** Extensions panel — bundled rows pick up the runtime chip (`deno · running`); user rows show `worker` + `· iOS-safe` footnote in the meta line; new user `Notes index` row demos `deno · idle`; stdio MCP `Filesystem` row picks up the indigo `child` chip + running dot while HTTP MCP rows stay one-chip. `+ New extension` now opens the `RuntimeChooserSheet` instead of jumping straight into the editor. Footnote rewritten to spell out the worker-vs-deno trust model.
- **iOS settings root** version line bumped to `gen·app · v0.7.0`.
- **Kit `README.md`** — Settings table now lists 5 sections (added Extensions chip detail + About row); file map describes the new atoms / sheet / panel; "What's stubbed" gains the editor-routing + licenses-bundle caveats.

### Fixed
- **Editor modal width on collapse.** The modal is a flex child of `.settings-overlay` (`display: flex; justify-content: center`). Setting just `width` left the modal stuck at 1240 px even when `aiOpen` flipped to false, because `min-width: auto` on flex items defaults to content min-size and CodeMirror's intrinsic width pushed the modal back wide. Fix: drive the size through `flex: '0 0 ${aiOpen ? 1240 : 940}px'` AND `minWidth: 0`. Modal now cycles cleanly 1240 ↔ 940 with each toggle; transition tween moved to `flex-basis 200ms`.
- **Duplicate React instances.** Initial esm.sh URLs used `&bundle` which inlined a fresh React per library; hooks then ran against a null dispatcher and crashed the editor with `Cannot read properties of null (reading 'useRef')`. Replaced with `?external=react,react-dom` + an importmap pointing at the shims re-exporting `window.React` / `window.ReactDOM`. Added `react/jsx-runtime` + `react/jsx-dev-runtime` shims since esm.sh's external bundles import them. Added `createRef` (and the rest of React 18's surface) to the shim's named exports.
- **AI panel header wrapping.** Slimmed the model picker from `claude-sonnet-4` to `sonnet ▾`, dropped the `· in this folder` subtitle, added `whiteSpace: nowrap` on the "Ask AI" title and `minWidth: 0` on the flex spacer so the header stays on one line.
- **`react-arborist` "unique key" warning.** Added `key={node.data.id}` on the Node renderer's outer div.

### Flagged
- **Library bundle weight.** `react-arborist` + `@uiw/react-codemirror` + the two language packs + `oneDark` add ~150 kb gzipped. Acceptable for desktop; iOS may want a `worker`-only fallback that swaps in a lighter editor (CodeMirror 6 minimal or even a `<textarea>`). Not built — flag for when the iOS kit grows real authoring.
- **Ask AI thread is static.** Content seeded for the visual contract; no real send/receive loop, slash commands, or context-attach UI. The Tweaks panel is the natural place to expose a "live demo" stream, but that's out of scope for a patch.
- **License list is illustrative.** The 8 packages in `ABOUT_LICENSES` are hand-picked. Real builds should generate this from the lockfile + Cargo metadata at bundle time and point the link at the real `THIRD_PARTY_NOTICES.md`.

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
