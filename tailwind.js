// tailwind.js — drop-in Tailwind v4 Play CDN + gen-app theme bridge.
// Any HTML file in this project can opt in by adding:
//   <script src="<relative-path-to>/tailwind.js"></script>
// before any markup that uses Tailwind classes.
//
// This script:
//   1. Loads Tailwind v4 from the jsDelivr CDN
//   2. Injects an inline @theme block that mirrors colors_and_type.css
//
// The @theme tokens are READABLE-NAMED so utilities are short:
//   bg-window, bg-card, bg-elevated, bg-base, bg-accent
//   text-fg1, text-fg2, text-fg3, text-fg4
//   text-green / red / orange / yellow / purple / teal / accent
//   border-hairline, border-soft
//   rounded-md / lg / xl / 2xl  (continues the iOS continuous-corner scale)
//   font-sans / mono / serif    (serif is Instrument Serif — playful display only)
//
// All theme values resolve via CSS custom properties, so [data-theme="light"]
// from colors_and_type.css will switch them automatically.

document.write(`
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>
<style type="text/tailwindcss">
  @theme {
    /* Surfaces */
    --color-base:        var(--bg-base);
    --color-window:      var(--bg-window);
    --color-card:        var(--bg-card);
    --color-elevated:    var(--bg-card-elevated);
    --color-input:       var(--bg-input);

    /* Accent + state */
    --color-accent:       var(--color-accent);
    --color-accent-press: var(--color-accent-press);
    --color-accent-tint:  var(--color-accent-tint);
    --color-accent-glow:  var(--color-accent-glow);

    /* Foreground hierarchy */
    --color-fg1: var(--fg1);
    --color-fg2: var(--fg2);
    --color-fg3: var(--fg3);
    --color-fg4: var(--fg4);

    /* Strokes */
    --color-hairline: var(--stroke-hairline);
    --color-soft:     var(--stroke-soft);

    /* Status palette */
    --color-green:  var(--color-green);
    --color-red:    var(--color-red);
    --color-orange: var(--color-orange);
    --color-yellow: var(--color-yellow);
    --color-purple: var(--color-purple);
    --color-pink:   var(--color-pink);
    --color-teal:   var(--color-teal);
    --color-indigo: var(--color-indigo);
    --color-mint:   var(--color-mint);

    /* Soft tints */
    --color-tint-green:  var(--tint-green);
    --color-tint-orange: var(--tint-orange);
    --color-tint-red:    var(--tint-red);
    --color-tint-yellow: var(--tint-yellow);
    --color-tint-purple: var(--tint-purple);

    /* Radii — iOS continuous-corner scale */
    --radius-xs:  4px;
    --radius-sm:  8px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 18px;
    --radius-2xl: 22px;
    --radius-3xl: 28px;

    /* Type families */
    --font-sans:  var(--font-sans);
    --font-mono:  var(--font-mono);
    --font-serif: var(--font-brand);

    /* Type scale (matches --text-*) */
    --text-2xs:  11px;
    --text-xs:   12px;
    --text-sm:   13px;
    --text-base: 15px;
    --text-md:   17px;
    --text-lg:   20px;
    --text-xl:   22px;
    --text-2xl:  28px;
    --text-3xl:  34px;
    --text-4xl:  44px;
  }
</style>
`);
