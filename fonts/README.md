# Fonts

This system uses **system fonts** + one Google-hosted display face.

| Role | Family | Source |
| --- | --- | --- |
| UI (body, headings, mono) | `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`, `Helvetica Neue`, sans-serif | **Native** on Apple platforms — no file shipped, no `@font-face` |
| Mono | `ui-monospace`, `SF Mono`, `Menlo`, `Monaco` | **Native** |
| Brand display (wordmark + occasional flourish) | `Instrument Serif` italic | **Google Fonts** — imported in `colors_and_type.css` |

## Why no font files are shipped

SF Pro is Apple's proprietary font. It cannot be embedded on the web, but the `-apple-system` keyword renders it natively on every Apple OS — which is where gen-app actually runs. We don't ship a fallback for non-Apple platforms because gen-app is macOS + iOS only.

## ⚠︎ Substitution flag

If you ever need a guaranteed cross-platform render (e.g. a marketing page rendered on Windows), substitute with **Geist Sans** as the closest neutral SF Pro alternative. **Flag this as a substitution** and ask the user to confirm.
