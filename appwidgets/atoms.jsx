/* ============================================================
   App-widget mockups — shared atoms
   Recreations of gen-app chrome + on-brand "app content" used
   inside the iframe stand-ins. Tokens from colors_and_type.css.
   Exported to window for the section files.
   ============================================================ */

function I({ n, c = "", s }) { return <i data-lucide={n} className={c} style={s}></i>; }
function Anno({ children }) { return <div className="anno">{children}</div>; }

/* macOS window title bar. Optional center title; children render at right. */
function MacBar({ title, children }) {
  return (
    <div className="mac-titlebar">
      <div className="mac-light r"></div>
      <div className="mac-light y"></div>
      <div className="mac-light g"></div>
      {title && <div className="flex-1 text-center text-[11.5px] font-semibold text-fg2">{title}</div>}
      {!title && <div className="flex-1"></div>}
      <div className="flex items-center gap-1.5">{children || <div style={{ width: 42 }}></div>}</div>
    </div>
  );
}

/* Authorship + runtime chips, process dot — lifted from the extension mockups. */
function KindChip({ kind }) {
  const map = { bundled: "kind-bundled", user: "kind-user", app: "kind-app" };
  return <span className={`kind-chip ${map[kind] || "kind-bundled"}`}>{kind}</span>;
}
function RtChip({ rt }) { return <span className={`rt-chip rt-${rt}`}>{rt}</span>; }
function Pdot({ state = "running" }) { return <span className={`pdot ${state}`}></span>; }

/* @symbol handle — shown top-left of every widget card. */
function SymbolTag({ name }) { return <span className="sym">@{name}</span>; }

/* iOS-style toggle. */
function Toggle({ on, color = "var(--color-green)" }) {
  return (
    <div className="relative w-[36px] h-[20px] rounded-[10px] shrink-0" style={{ background: on ? color : "var(--fg4)" }}>
      <div className="absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white" style={{ left: on ? 18 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

/* Dot-grid canvas background. */
const dotGrid = {
  background: "var(--bg-window)",
  backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

/* Striped placeholder per design-system imagery rule (no hand-drawn art). */
function Placeholder({ label, h = 120, style = {} }) {
  return (
    <div className="rounded-[10px] flex items-center justify-center relative overflow-hidden" style={{
      height: h,
      background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 10px, rgba(255,255,255,0.015) 10px 20px)",
      border: "1px solid var(--stroke-soft)", ...style,
    }}>
      <span className="font-mono text-[10px] tracking-[0.04em]" style={{ color: "var(--fg3)" }}>{label}</span>
    </div>
  );
}

/* ── iframe chrome banner: a hairline strip marking the iframe boundary,
   carrying the loopback origin so the "served by the extension" story reads. */
function IframeOrigin({ port = "51847", path = "/" }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9.5px]" style={{ color: "var(--fg3)", borderBottom: "1px solid var(--stroke-hairline)", background: "rgba(255,255,255,0.012)" }}>
      <I n="square-dashed" c="w-2.5 h-2.5" />
      <span>iframe · 127.0.0.1:{port}{path}</span>
      <span className="flex-1"></span>
      <I n="shield" c="w-2.5 h-2.5 text-green" />
      <span style={{ color: "var(--color-green)" }}>sandboxed</span>
    </div>
  );
}

/* ============================================================
   ON-BRAND APP CONTENT — what renders inside the iframe.
   Each is built only from host-* primitive aesthetics + tokens.
   ============================================================ */

/* Calendar app — month grid (a Tier-3 stateful app). */
function CalendarApp({ compact }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 2); // offset so 1st lands on a weekday
  const events = { 4: "var(--color-accent)", 9: "var(--color-green)", 12: "var(--color-orange)", 18: "var(--color-accent)", 23: "var(--color-purple)", 26: "var(--color-green)" };
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div className="text-[13px] font-semibold text-fg1">May 2026</div>
        <span className="flex-1"></span>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-6 rounded-md inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-fg2"><I n="chevron-left" c="w-3.5 h-3.5" /></button>
          <button className="w-6 h-6 rounded-md inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-fg2"><I n="chevron-right" c="w-3.5 h-3.5" /></button>
        </div>
        {!compact && <button className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white border-none cursor-pointer" style={{ background: "var(--color-accent)" }}>Today</button>}
      </div>
      <div className="grid grid-cols-7 px-2 pt-2" style={{ gap: 2 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-center text-[9px] font-semibold uppercase tracking-[0.04em]" style={{ color: "var(--fg3)" }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 px-2 pb-2 flex-1" style={{ gap: 2 }}>
        {days.map((d, i) => {
          const valid = d >= 1 && d <= 31;
          const today = d === 12;
          return (
            <div key={i} className="rounded-md flex flex-col items-center justify-start pt-1 relative" style={{
              background: today ? "var(--color-accent-tint)" : valid ? "var(--bg-card)" : "transparent",
              border: today ? "1px solid var(--color-accent)" : "1px solid transparent",
            }}>
              {valid && <span className="text-[10.5px]" style={{ color: today ? "var(--color-accent)" : "var(--fg1)", fontWeight: today ? 700 : 400 }}>{d}</span>}
              {events[d] && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: events[d] }}></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Code editor app — Monaco-in-a-themed-shell (Tier-2 document-as-app). */
function CodeApp() {
  const L = ({ n, children }) => (
    <div className="editor-line"><span className="ln">{n}</span><span>{children}</span></div>
  );
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: "var(--bg-card)" }}>
          <I n="file-code" c="w-3 h-3 text-cyan" /><span className="font-mono text-[10.5px] text-fg1">bridge.ts</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"><span className="font-mono text-[10.5px] text-fg3">app-sdk.ts</span></div>
        <span className="flex-1"></span>
        <span className="font-mono text-[9.5px] text-fg3">TypeScript · UTF-8</span>
      </div>
      <div className="flex-1 py-2 overflow-hidden">
        <L n="14"><span className="ed-kw">export</span> <span className="ed-kw">function</span> <span className="ed-fn">createBridge</span>(<span className="ed-mute">port</span>: <span className="ed-fn">number</span>) {'{'}</L>
        <L n="15"><span className="ed-mute">{"  "}</span><span className="ed-kw">const</span> ctx = <span className="ed-fn">connect</span>(<span className="ed-str">`http://127.0.0.1:${'{'}port{'}'}`</span>);</L>
        <L n="16"><span className="ed-mute">{"  "}</span><span className="ed-cmt">// theme tokens arrive on mount + on change</span></L>
        <L n="17"><span className="ed-mute">{"  "}</span>ctx.theme.<span className="ed-fn">onChange</span>(<span className="ed-fn">applyTokens</span>);</L>
        <L n="18"><span className="ed-mute">{"  "}</span><span className="ed-kw">return</span> ctx;<span className="caret"></span></L>
        <L n="19">{'}'}</L>
      </div>
    </div>
  );
}

/* Map app — MapLibre-in-shell. Honest striped placeholder + pins + search. */
function MapApp() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <I n="search" c="w-3 h-3 text-fg3" /><span className="text-[11px] text-fg3">Search places…</span>
        </div>
        <button className="w-7 h-7 rounded-lg inline-flex items-center justify-center border-none cursor-pointer" style={{ background: "var(--bg-card)" }}><I n="locate" c="w-3.5 h-3.5 text-accent" /></button>
      </div>
      <div className="flex-1 relative m-2 rounded-[10px] overflow-hidden" style={{ background: "repeating-linear-gradient(135deg, rgba(100,210,255,0.06) 0 14px, rgba(94,92,230,0.04) 14px 28px)", border: "1px solid var(--stroke-soft)" }}>
        <span className="absolute top-2 left-2 font-mono text-[9px]" style={{ color: "var(--fg3)" }}>map-viewer · maplibre</span>
        <I n="map-pin" c="w-5 h-5 text-accent" s={{ position: "absolute", top: "32%", left: "40%" }} />
        <I n="map-pin" c="w-4 h-4 text-red" s={{ position: "absolute", top: "55%", left: "62%" }} />
        <I n="map-pin" c="w-4 h-4 text-green" s={{ position: "absolute", top: "44%", left: "24%" }} />
      </div>
    </div>
  );
}

/* Kanban app — drag board on extension sqlite (Tier-3). */
function KanbanApp() {
  const cols = [
    { t: "Backlog", n: 4, cards: ["Spike: pdf.js annotations", "Token contract freeze"] },
    { t: "Building", n: 2, cards: ["app-bridge RPC", "host-* SDK"] },
    { t: "Shipped", n: 3, cards: ["Loopback iframe"] },
  ];
  const accent = ["var(--fg3)", "var(--color-accent)", "var(--color-green)"];
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div className="text-[13px] font-semibold text-fg1">Substrate roadmap</div>
        <span className="flex-1"></span>
        <button className="text-[11px] font-semibold px-2 py-1 rounded-full text-fg2 bg-transparent cursor-pointer flex items-center gap-1" style={{ border: "1px solid var(--stroke-soft)" }}><I n="plus" c="w-3 h-3" />Card</button>
      </div>
      <div className="flex gap-2 p-2 flex-1 overflow-hidden">
        {cols.map((c, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-1.5 rounded-[10px] p-1.5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent[ci] }}></span>
              <span className="text-[10.5px] font-semibold text-fg1">{c.t}</span>
              <span className="text-[9.5px] font-mono" style={{ color: "var(--fg3)" }}>{c.n}</span>
            </div>
            {c.cards.map((card, i) => (
              <div key={i} className="rounded-lg p-2 text-[10.5px] leading-[1.35] text-fg1" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>{card}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Notes app — list with tags (Tier-3). */
function NotesApp() {
  const notes = [
    { t: "Bridge failure modes", tag: "arch", c: "var(--color-accent)" },
    { t: "Why same-origin iframe", tag: "decisions", c: "var(--color-purple)" },
    { t: "Token broadcast shape", tag: "theme", c: "var(--color-green)" },
    { t: "Permission layers ×7", tag: "security", c: "var(--color-orange)" },
  ];
  return (
    <div className="w-full h-full flex" style={{ background: "var(--bg-window)" }}>
      <div className="w-[42%] flex flex-col" style={{ borderRight: "1px solid var(--stroke-hairline)" }}>
        <div className="px-2.5 py-2 flex items-center gap-1.5" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
          <I n="search" c="w-3 h-3 text-fg3" /><span className="text-[10.5px] text-fg3">Search notes</span>
        </div>
        {notes.map((n, i) => (
          <div key={i} className="px-2.5 py-2 flex flex-col gap-1" style={{ background: i === 0 ? "var(--bg-selected)" : "transparent", borderBottom: "1px solid var(--stroke-hairline)" }}>
            <div className="text-[11px] font-semibold text-fg1 truncate">{n.t}</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: n.c }}></span>
              <span className="text-[9px] font-mono" style={{ color: "var(--fg3)" }}>{n.tag}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="text-[14px] font-semibold text-fg1">Bridge failure modes</div>
        <div className="text-[10.5px] leading-[1.55] text-fg2">Every host call passes one chokepoint. Each branch writes a typed bridge_event — denied, invalid, not_ready, timeout, bad_origin, subprocess_died.</div>
        <div className="text-[10.5px] leading-[1.55] text-fg2">read_bridge_log filters by kind so a debug session asks "show me every denial for this widget" in one call.</div>
      </div>
    </div>
  );
}

/* Skeleton — typed loading state matching host-skeleton. */
function SkeletonApp({ label = "Starting calendar…" }) {
  const bar = (w, h = 10) => <div style={{ width: w, height: h, borderRadius: 5, background: "linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card-elevated) 50%, var(--bg-card) 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s linear infinite" }}></div>;
  return (
    <div className="w-full h-full flex flex-col gap-3 p-4" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-2">{bar(120, 14)}<span className="flex-1"></span>{bar(48, 20)}</div>
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {Array.from({ length: 21 }).map((_, i) => <div key={i} style={{ borderRadius: 6, background: "var(--bg-card)", opacity: 0.6 }}></div>)}
      </div>
      <div className="flex items-center gap-2 justify-center">
        <span className="pdot running"></span>
        <span className="text-[11px] font-mono" style={{ color: "var(--fg3)" }}>{label}</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  I, Anno, MacBar, KindChip, RtChip, Pdot, Toggle, dotGrid, Placeholder,
  IframeOrigin, CalendarApp, CodeApp, MapApp, KanbanApp, NotesApp, SkeletonApp,
  SymbolTag,
});
