# gen-app UI kit

A click-thru recreation of the gen-app product covering both form factors — a resizable macOS window and an iPhone — side by side in one view.

> **Heads up.** No real codebase or Figma was attached for this design system, so this kit is built from the product spec only. Visual decisions (layout, dock chrome, onboarding copy) are inferred. When you wire this back to the real Tauri/React codebase, treat these as visual references, not contracts.

## How to view

Open `index.html`. You'll see:
- **Left:** a desktop macOS window with the canvas (3 seed widgets) and a docked chat panel. Click the ⚙ in the toolbar to open Settings.
- **Right:** an iPhone showing the same canvas. Tap the floating ⚙ top-right to open the iOS Settings stack.

The two frames share state — click a widget in either frame to select it; the dock will show an `ADDRESSING @symbol` strip and your next message will operate on those widgets.

## Settings

Five sections, named conventionally on desktop and playfully on iOS:

| Desktop | iOS | What's inside |
| --- | --- | --- |
| Providers | **Brains** | Pick the active provider, paste the key, choose the model |
| Embeddings | **Senses** | Local llama.cpp or remote OpenAI; cache controls |
| Extensions | **Powers** | Bundled + user-authored + MCP extensions. Every row carries a kind chip and a **runtime chip** (`worker` / `deno` / `child`). Deno + stdio MCP rows pulse a process-status dot. "New extension" opens a small **runtime chooser** sheet first. Worker rows get a `· iOS-safe` footnote on the meta line. |
| Logs | **Diaries** | Live event stream from chat / widgets / extensions with info/warn/error tagging |
| About | **About** | App version + build, deno / Tauri / llama.cpp / Claude CLI versions, data folder sizes (open in Finder), log archive Export, and the open-source license list with link to `THIRD_PARTY_NOTICES.md` |

Desktop uses a split sheet (sidebar + detail). iOS uses a nav stack (list → detail → back).

## Symbols (@-mentions)

Every widget carries a stable `@symbol` handle the model can address from chat. Three ways it works:

1. **Address by selection.** Click widget(s) in the canvas → dock shows the `ADDRESSING` strip → type → message is sent with those widgets as targets.
2. **Address by mention.** Type `@symbol` directly in the composer (e.g. `summarize @market`). The chat renders the mention as an inline chip.
3. **Address by tag.** Multiple widgets can share a symbol (e.g. three stock widgets all tagged `@market`); mentioning the symbol resolves to all of them.

The placeholder ("Ask the model to change them…") and the `addressing N` count in the dock header are the disambiguation surface — the user always sees what the next message will touch.

## Tweaks

Toggle the Tweaks panel from the toolbar for:

| Tweak | What it does |
| --- | --- |
| Show onboarding overlay | Mounts the four-step first-run sheet over everything else |
| Seed canvas with widgets | Off → empty-canvas hero state |
| Reset canvas + chat | Clears state |
| Send @market mention | Demos the inline `@symbol` parsing |
| Create another widget | Demos a fresh widget pop animation |

## File map

| File | Purpose |
| --- | --- |
| `index.html` | Bootstraps React + Babel + Lucide, mounts the kit |
| `styles.css` | Kit-specific layout & component CSS (depends on `../../colors_and_type.css`) |
| `Icon.jsx` | Lucide wrapper (renders `<i data-lucide>` then post-processes the SVG) |
| `Primitives.jsx` | `Button`, `ListRow`, `Toggle`, `Segmented` |
| `Frames.jsx` | `DesktopFrame` (macOS window chrome), `IPhoneFrame` (notch + status bar + home indicator) |
| `Widget.jsx` | `WidgetShell`, `StatusPill`, and the three demo widgets — `WeatherWidget`, `StockWidget`, `CalendarWidget`, `PendingWidget` |
| `Canvas.jsx` | `Canvas`, `CanvasEmpty`, `ChatFullscreen` (variant B), `TabBar` |
| `ChatDock.jsx` | The floating dock used by desktop & variant A |
| `Settings.jsx` | Settings panels: Providers / Embeddings / Extensions / Secrets / Logs / **About**. Includes `DesktopSettings` (split sheet), `IOSSettings` (nav stack), the inline `RuntimeChip` / `StatusDot` atoms, the `RuntimeChooserSheet` for new extensions, and the `AboutPanel` with open-source license list. |
| `Onboarding.jsx` | Three-step first-run flow: welcome → provider → key |
| `App.jsx` | State machine + Tweaks wiring + mount |
| `tweaks-panel.jsx` | Tweaks framework (starter component, untouched) |

## Component-to-Konsta mapping

Every component here is a visual recreation of what the corresponding Konsta UI component renders. When wiring to the real app, replace each file with the Konsta equivalent:

| Kit component | Konsta primitive |
| --- | --- |
| `Button` | `Button` (variants: `clear` for tertiary; manual chrome for icon-only) |
| `ListRow` | `ListItem` with `media` + `title` + `after` + radio variant |
| `Toggle` | `Toggle` |
| `Segmented` | `Segmented` + `SegmentedButton` |
| `TabBar` | `Tabbar` + `TabbarLink` |
| `ChatDock` | *(custom)* — Konsta has no FAB; this is a `Card` with `Block` inside |
| `WidgetShell` | `Card` with custom header + body slots |
| `Sheet` (referenced) | `Sheet` |
| `Onboarding` Steps | `Page` + `Block` + `List` + `Button` |
| `DesktopFrame` | *(none — Konsta is iOS-first)* hand-rolled macOS chrome |

## What's stubbed

- **Drag-and-drop of widgets.** Widgets are selectable (blue ring) but not draggable. The real app would back this with a layout grid.
- **Provider auth.** The "Add key" step accepts any text and moves on.
- **Multi-select gesture on iOS.** Stubbed — clicking selects, but there's no long-press affordance.
- **Symbols / tag pickers.** Toolbar `Tag` button is non-functional. See `preview/components-tags.html` for the visual spec.
- **Real Lucide → SF Symbols swap.** Lucide is used as a web-friendly stand-in; see `assets/iconography.md` for the mapping.
- **Extension authoring (post-chooser).** The runtime-chooser sheet routes into the legacy `ExtensionEditor` regardless of pick. A real deno-runtime editor (`apps/desktop/src/settings/ExtensionFolderEditor.tsx`) lives in the repo — swap it in when wiring up.
- **About → license bundle.** The 8 packages in `ABOUT_LICENSES` are illustrative; real builds should generate this from the lockfile + Cargo metadata at bundle time and point the link at the real `THIRD_PARTY_NOTICES.md`.

## What I'd build next

1. **Provider sheet** with cost estimate + model picker.
2. **Widget detail / settings sheet** — accessed from the `⋯` icon. This is where the declarative spec lives.
3. **Bulk-select on canvas** — desktop: cmd-click and marquee; iOS: long-press.
4. **Settings → Powers** with toggle list + extension detail.
5. **Logs viewer** (Diaries) — terminal-style monospace stream.
