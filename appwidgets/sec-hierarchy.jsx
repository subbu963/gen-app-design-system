/* ============================================================
   Section H — The four-step build hierarchy + host-* SDK catalog
   Section I — Dev MCP: bridge log, subprocess, runtime state
   ============================================================ */

const { I, Anno, Pdot } = window;

/* ───────── H · the hierarchy ladder + catalog ───────── */
function Hierarchy() {
  const steps = [
    { n: 1, icon: "layout-template", color: "var(--color-accent)", title: "Pick a template", sub: "Whole-app category", body: "One tool call. The artifact exists.", ex: ["pdf-viewer", "video-player", "code-editor", "map-viewer", "markdown-doc", "kanban", "notes"] },
    { n: 2, icon: "package", color: "var(--color-purple)", title: "Wrapped-library component", sub: "Heavy domain, dropped in", body: "Battle-tested lib, ≤10 themed props.", ex: ["host-video", "host-pdf", "host-code", "host-map", "host-rich-text", "host-data-grid", "host-tree", "host-json"] },
    { n: 3, icon: "shapes", color: "var(--color-green)", title: "Compose host-* primitives", sub: "Normal UI shapes", body: "The chrome around the component.", ex: ["host-card", "host-button", "host-slider", "host-dialog", "host-popover", "host-drawer", "host-command-bar", "host-tag-input"] },
    { n: 4, icon: "code", color: "var(--color-orange)", title: "Raw HTML + CSS", sub: "Residual escape valve", body: "Tokens only. Lint flags raw hex / fonts.", ex: ["var(--color-accent)", "var(--space-5)", "var(--radius-lg)"] },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-3 p-6 overflow-hidden" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Decision 8 · the LLM tries these in order — composition is the last resort, not the first</div>
      <div className="flex flex-col gap-2 flex-1">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-stretch gap-3 rounded-[12px] p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)", borderLeft: `3px solid ${s.color}` }}>
            <div className="flex flex-col items-center gap-1 w-12 shrink-0">
              <div className="w-9 h-9 rounded-[10px] inline-flex items-center justify-center" style={{ background: `color-mix(in oklab, ${s.color} 16%, transparent)` }}><I n={s.icon} c="" s={{ width: 18, height: 18, color: s.color }} /></div>
              <span className="text-[9px] font-mono font-semibold" style={{ color: s.color }}>STEP {s.n}</span>
            </div>
            <div className="w-[190px] shrink-0 flex flex-col justify-center gap-0.5">
              <div className="text-[13px] font-semibold text-fg1">{s.title}</div>
              <div className="text-[10px] font-mono" style={{ color: "var(--fg3)" }}>{s.sub}</div>
              <div className="text-[10.5px] text-fg2 leading-[1.4] mt-0.5">{s.body}</div>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-1.5 content-center">
              {s.ex.map(e => (
                <span key={e} className="font-mono text-[10px] px-2 py-1 rounded-md" style={{ background: i === 0 ? "var(--bg-card-elevated)" : "var(--bg-window)", color: i === 3 ? s.color : "var(--fg1)", border: "1px solid var(--stroke-soft)" }}>{i >= 1 && i <= 2 ? `<${e}>` : e}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10.5px] text-fg2 leading-[1.5]">
        <I n="trending-up" c="w-3.5 h-3.5 text-accent shrink-0" />
        Promotion path — a raw-HTML idea (step 4) that proves useful becomes a primitive (step 3), then a wrapped component (step 2) or template (step 1). Items move up over time.
      </div>
    </div>
  );
}

/* ───────── H · the host-* catalog at a glance ───────── */
function SdkCatalog() {
  const groups = [
    { t: "Wrapped libraries", c: "var(--color-purple)", items: ["host-video", "host-audio", "host-pdf", "host-code", "host-rich-text", "host-markdown", "host-map", "host-data-grid", "host-tree", "host-json"] },
    { t: "Declarative duals", c: "var(--color-accent)", items: ["host-card", "host-button", "host-stack", "host-text", "host-stat", "host-table", "host-skeleton"] },
    { t: "Interaction shapes", c: "var(--color-green)", items: ["host-slider", "host-icon-button", "host-popover", "host-tooltip", "host-context-menu"] },
    { t: "Overlays", c: "var(--color-orange)", items: ["host-dialog", "host-drawer", "host-toast"] },
    { t: "Layout", c: "var(--color-cyan)", items: ["host-scroll-area", "host-split", "host-accordion", "host-focus-ring"] },
    { t: "Inputs", c: "var(--color-indigo)", items: ["host-combobox", "host-multi-select", "host-tag-input", "host-mention", "host-file-drop", "host-color", "host-date-range"] },
    { t: "Chrome & lists", c: "var(--color-pink)", items: ["host-command-bar", "host-empty-state", "host-thumb-strip", "host-sortable"] },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-3 p-6 overflow-hidden" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">libs/app-sdk · the vocabulary the model composes from at steps 2–3</div>
      <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
        {groups.map(g => (
          <div key={g.t} className="rounded-[10px] p-2.5 flex flex-col gap-2" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.c }}></span>
              <span className="text-[11px] font-semibold text-fg1">{g.t}</span>
              <span className="text-[9px] font-mono" style={{ color: "var(--fg3)" }}>{g.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {g.items.map(it => <span key={it} className="font-mono text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-window)", color: "var(--fg2)", border: "1px solid var(--stroke-soft)" }}>{it}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-fg3 leading-[1.5]">Every primitive is styled by the same <code className="font-mono">primitives.css</code> and reads tokens broadcast across the iframe boundary — a <code className="font-mono text-[9.5px]">&lt;host-button&gt;</code> is pixel-identical to a Tier-0/1 widget.</div>
    </div>
  );
}

/* ───────── I · Dev MCP — bridge log viewer ───────── */
function BridgeLog() {
  const kinds = [
    ["all", null, 42], ["query", "var(--color-accent)", 18], ["denied", "var(--color-red)", 3],
    ["not_ready", "var(--color-orange)", 5], ["timeout", "var(--color-red)", 1], ["bad_origin", "var(--color-purple)", 2], ["state", "var(--fg2)", 13],
  ];
  const rows = [
    { t: "12:04:18.221", kind: "bridge.query", c: "var(--color-accent)", txt: "weather · current", meta: "14ms · {temp:n, code:s}" },
    { t: "12:04:18.198", kind: "bridge.state", c: "var(--fg2)", txt: "set · @board", meta: "2ms · ok" },
    { t: "12:04:17.882", kind: "bridge.not_ready", c: "var(--color-orange)", txt: "projects-board · board:list", meta: "queued · drained on start" },
    { t: "12:04:17.610", kind: "bridge.denied", c: "var(--color-red)", txt: "weather · forecast", meta: "reason: no_grant" },
    { t: "12:04:16.004", kind: "bridge.timeout", c: "var(--color-red)", txt: "pdf-tools · render", meta: "30000ms" },
    { t: "12:04:15.771", kind: "bridge.bad_origin", c: "var(--color-purple)", txt: "dropped message", meta: "observed :51999 ≠ :51847" },
    { t: "12:04:15.220", kind: "bridge.theme", c: "var(--color-green)", txt: "broadcast received", meta: "1ms · mode:dark" },
  ];
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <I n="activity" c="w-4 h-4 text-accent" />
        <span className="text-[13px] font-semibold text-fg1">read_bridge_log</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-card-elevated)", color: "var(--fg3)" }}>widget @board</span>
        <span className="flex-1"></span>
        <span className="text-[9.5px] font-mono inline-flex items-center gap-1" style={{ color: "var(--fg3)" }}><I n="bug" c="w-3 h-3" />dev MCP only</span>
      </div>
      {/* kind filter chips */}
      <div className="px-4 py-2 flex items-center gap-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        {kinds.map(([k, c, n], i) => (
          <span key={k} className="font-mono text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer" style={{
            background: i === 0 ? "var(--color-accent-tint)" : "var(--bg-card)", border: `1px solid ${i === 0 ? "var(--color-accent)" : "var(--stroke-soft)"}`,
            color: i === 0 ? "var(--color-accent)" : "var(--fg2)", opacity: i === 0 ? 1 : 0.85,
          }}>
            {c && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }}></span>}
            {k}<span style={{ color: "var(--fg4)" }}>{n}</span>
          </span>
        ))}
      </div>
      {/* log rows */}
      <div className="flex-1 min-h-0 overflow-hidden font-mono">
        {rows.map((r, i) => (
          <div key={i} className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: "1px solid var(--stroke-hairline)", background: r.kind.includes("denied") || r.kind.includes("timeout") ? "rgba(255,69,58,0.05)" : "transparent" }}>
            <span className="text-[9.5px]" style={{ color: "var(--fg4)" }}>{r.t}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1.5 shrink-0" style={{ background: `color-mix(in oklab, ${r.c} 14%, transparent)`, color: r.c, minWidth: 130 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.c }}></span>{r.kind}
            </span>
            <span className="text-[10.5px] text-fg1 flex-1 truncate">{r.txt}</span>
            <span className="text-[9.5px]" style={{ color: "var(--fg3)" }}>{r.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── I · Subprocess stdout + runtime state ───────── */
function SubprocessPanel() {
  return (
    <div className="w-full h-full flex flex-col gap-3 p-4" style={{ background: "var(--bg-window)" }}>
      {/* runtime state */}
      <div className="rounded-[12px] overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
        <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
          <I n="cpu" c="w-3.5 h-3.5 text-accent" />
          <span className="text-[12px] font-semibold text-fg1">read_extension_runtime_state</span>
          <span className="font-mono text-[10px]" style={{ color: "var(--fg3)" }}>pdf-tools</span>
          <span className="flex-1"></span>
          <span className="text-[10px] font-mono inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(48,209,88,0.14)", color: "var(--color-green)" }}><Pdot state="running" />Running</span>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--stroke-hairline)" }}>
          {[["listenPort", "51847"], ["outPort", "51848"], ["restarts", "1"], ["pin count", "2 iframes"], ["idle-stop in", "4m 51s"], ["last crash", "TypeError @ index.ts:42"]].map(([k, v], i) => (
            <div key={i} className="px-3 py-2 flex flex-col gap-0.5" style={{ background: "var(--bg-card)" }}>
              <span className="text-[9px] font-mono uppercase tracking-[0.04em]" style={{ color: "var(--fg3)" }}>{k}</span>
              <span className="text-[11px] font-mono" style={{ color: k === "last crash" ? "var(--color-red)" : "var(--fg1)" }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid var(--stroke-hairline)" }}>
          <button className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full text-fg2 bg-transparent cursor-pointer flex items-center gap-1.5" style={{ border: "1px solid var(--stroke-soft)" }}><I n="rotate-cw" c="w-3 h-3" />force_restart</button>
          <button className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full text-fg2 bg-transparent cursor-pointer flex items-center gap-1.5" style={{ border: "1px solid var(--stroke-soft)" }}><I n="power" c="w-3 h-3" />force_idle_stop</button>
        </div>
      </div>
      {/* stdout ring buffer */}
      <div className="rounded-[12px] flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "var(--bg-base)", border: "1px solid var(--stroke-soft)" }}>
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
          <I n="terminal" c="w-3.5 h-3.5 text-green" />
          <span className="text-[12px] font-semibold text-fg1">read_extension_stdout</span>
          <span className="flex-1"></span>
          <span className="text-[9px] font-mono" style={{ color: "var(--fg4)" }}>ring · 256KB</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-3 font-mono text-[10px] leading-[1.7]">
          {[["out", "Deno.serve listening on 127.0.0.1:51847", "var(--fg2)"],
            ["out", "[app:calendar] mounted, theme=dark", "var(--fg2)"],
            ["err", "TypeError: Cannot read property 'x' of undefined", "var(--color-red)"],
            ["err", "    at render (index.ts:42:11)", "var(--color-red)"],
            ["out", "restarting (backoff 2s)…", "var(--color-orange)"],
            ["out", "Deno.serve listening on 127.0.0.1:51847", "var(--fg2)"]].map(([s, t, c], i) => (
            <div key={i} className="flex gap-2"><span style={{ color: s === "err" ? "var(--color-red)" : "var(--fg4)", width: 24 }}>{s}</span><span style={{ color: c }}>{t}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Hierarchy, SdkCatalog, BridgeLog, SubprocessPanel });
