/* ============================================================
   Section A — An app owns the whole canvas (model + lifecycle)
   Section B — Canvas mode chrome (full-viewport app)
   App widgets are NEVER cards in the grid: a canvas tab holds a
   widget grid; an app tab renders ONE artifact full-bleed.
   ============================================================ */

const { I, Anno, MacBar, KindChip, RtChip, Pdot, SymbolTag, dotGrid,
        IframeOrigin, CalendarApp, CodeApp, MapApp, KanbanApp, NotesApp, SkeletonApp } = window;

/* ── Plain widget card (declarative / glue widgets only — NOT apps). ── */
function WidgetCard({ sym, title, chips = true, kind = "user", rt = "worker", children, h = 240, w, foot }) {
  return (
    <div className="flex flex-col rounded-[14px] overflow-hidden relative" style={{
      width: w, height: h, background: "var(--bg-card)",
      border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-1)",
    }}>
      <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <I n="grip-vertical" c="w-3 h-3" s={{ color: "var(--fg4)", cursor: "grab" }} />
        <SymbolTag name={sym} />
        {title && <span className="text-[11px] text-fg2 truncate">{title}</span>}
        <span className="flex-1"></span>
        {chips && <><KindChip kind={kind} /><RtChip rt={rt} /><Pdot state="running" /></>}
        <button className="w-5 h-5 rounded inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-fg3"><I n="more-horizontal" c="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      {foot && <div className="px-2.5 py-1.5 text-[9.5px] font-mono flex items-center gap-1.5" style={{ color: "var(--fg3)", borderTop: "1px solid var(--stroke-hairline)" }}>{foot}</div>}
    </div>
  );
}

/* Squircle app-icon (canvas-mode lane) — matches the chosen Section C language. */
function AppGlyphLocal({ icon, color, size = 18 }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: size * 0.32, background: `color-mix(in oklab, ${color} 28%, var(--bg-card))`, border: `1px solid color-mix(in oklab, ${color} 55%, transparent)`, boxShadow: `inset 0 1px 0 color-mix(in oklab, ${color} 35%, transparent)` }}>
      <I n={icon} c="" s={{ width: size * 0.56, height: size * 0.56, color }} />
    </span>
  );
}

/* ── A canvas-mode title bar: shared lane (canvas pills + app tab). ── */
function CanvasTabStrip({ active = "app", pending }) {
  const planningOn = active === "grid" || pending;
  const appOn = active === "app";
  return (
    <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full pointer-events-auto" style={{ background: "var(--bg-window)" }}>
        <span className="text-[11px] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5" style={{ color: planningOn ? "var(--fg1)" : "var(--fg2)", background: planningOn ? "var(--bg-card)" : "transparent", fontWeight: planningOn ? 600 : 400, border: planningOn ? "1px solid var(--stroke-soft)" : "1px solid transparent" }}>
          <I n="layout-grid" c="" s={{ width: 11, height: 11, color: planningOn ? "var(--fg2)" : "var(--fg3)" }} />Planning
        </span>
        <span className="text-[11px] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 text-fg2"><I n="layout-grid" c="" s={{ width: 11, height: 11, color: "var(--fg3)" }} />Trading</span>
        <div style={{ width: 1, height: 18, background: "var(--stroke-hairline)", margin: "0 3px" }}></div>
        <span className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full" style={{
          background: appOn ? "color-mix(in oklab, var(--color-green) 15%, transparent)" : "transparent",
          border: pending ? "1px dashed color-mix(in oklab, var(--color-green) 55%, transparent)" : appOn ? "1px solid color-mix(in oklab, var(--color-green) 45%, transparent)" : "1px solid transparent",
        }}>
          <AppGlyphLocal icon="dumbbell" color="var(--color-green)" size={18} />
          <span className="text-[11px]" style={{ color: appOn || pending ? "var(--fg1)" : "var(--fg2)", fontWeight: appOn ? 600 : 400 }}>Workouts</span>
          {pending ? <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: "var(--bg-card-elevated)", color: "var(--fg3)" }}>session</span> : <span className="rounded-full" style={{ width: 5, height: 5, background: "var(--color-green)" }}></span>}
        </span>
      </div>
    </div>
  );
}

/* Chat launcher pill (collapsed, bottom-right). */
function ChatLauncher({ label = "Ask gen-app" }) {
  return (
    <button className="absolute z-10 flex items-center gap-2 pl-2.5 pr-3.5 py-2.5 rounded-full border-none cursor-pointer" style={{ right: 18, bottom: 18, background: "var(--vibrancy-dock)", backdropFilter: "var(--blur-regular)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)" }}>
      <div className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent)" }}><I n="sparkles" c="w-3.5 h-3.5 text-white" /></div>
      <span className="text-[12px] font-semibold text-fg1">{label}</span>
    </button>
  );
}

/* The ⋯ overflow menu for an app (canvas mode). */
function AppCardMenu({ mode = "canvas" }) {
  const Item = ({ icon, label, hint, danger, accent }) => (
    <div className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer" style={{ color: danger ? "var(--color-red)" : accent ? "var(--color-accent)" : "var(--fg1)" }}>
      <I n={icon} c="w-3.5 h-3.5" s={{ opacity: 0.85 }} />
      <span className="text-[12px] flex-1">{label}</span>
      {hint && <span className="font-mono text-[9.5px]" style={{ color: "var(--fg3)" }}>{hint}</span>}
    </div>
  );
  const Sep = () => <div style={{ height: 1, background: "var(--stroke-hairline)", margin: "4px 0" }}></div>;
  return (
    <div className="absolute z-20 rounded-[12px] py-1.5 w-[214px]" style={{
      top: 44, right: 12, background: "var(--vibrancy-popover)", backdropFilter: "var(--blur-thin)",
      border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-3)",
    }}>
      <Item icon="rotate-cw" label="Reload app" />
      <Item icon="code-2" label="View source" />
      <Item icon="folder-open" label="Open in editor" />
      <Sep />
      <Item icon="x" label="Close app" hint="⌘⌫" danger />
    </div>
  );
}

/* ───────── A · The model — canvas-of-widgets vs canvas-as-app ───────── */
function CanvasModel() {
  const Win = ({ children }) => (
    <div className="mac-window flex-1 flex flex-col" style={{ minWidth: 0 }}>{children}</div>
  );
  return (
    <div className="w-full h-full p-5 flex flex-col gap-3" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Decision 6 · an app is never a card in the grid — it takes the entire canvas</div>
      <div className="flex-1 min-h-0 flex items-stretch gap-5">
        {/* LEFT — a canvas tab = grid of widgets */}
        <div className="flex-1 flex flex-col gap-2" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2"><Anno>Canvas tab</Anno><span className="text-[11px] text-fg2">a grid of live widgets</span></div>
          <Win>
            <MacBar><CanvasTabStrip active="grid" /></MacBar>
            <div className="flex-1 min-h-0 relative" style={dotGrid}>
              <div className="absolute inset-0 p-3 grid grid-cols-2 gap-2.5" style={{ gridAutoRows: "min-content" }}>
                <WidgetCard sym="market" kind="bundled" rt="worker" h={104} foot={<><I n="clock" c="w-2.5 h-2.5" />3 min ago</>}>
                  <div className="flex-1 flex flex-col justify-center px-3">
                    <div className="text-[9px] font-mono text-fg3">AAPL</div>
                    <div className="text-[22px] font-semibold text-green" style={{ letterSpacing: "-0.022em" }}>$224.18</div>
                  </div>
                </WidgetCard>
                <WidgetCard sym="weather" kind="bundled" rt="worker" h={104}>
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <I n="cloud-sun" c="w-7 h-7 text-orange" />
                    <div className="flex flex-col"><span className="text-[22px] font-semibold text-fg1" style={{ letterSpacing: "-0.022em" }}>68°</span><span className="text-[9px] font-mono text-fg3">partly cloudy</span></div>
                  </div>
                </WidgetCard>
                <div style={{ gridColumn: "span 2" }}>
                  <WidgetCard sym="hn" title="Hacker News" kind="user" rt="worker" h={132} foot={<><I n="clock" c="w-2.5 h-2.5" />live</>}>
                    <div className="flex-1 flex flex-col">
                      {["Show HN: a local-first…", "The case for loopback…", "Ask HN: deno in prod?"].map((t, i) => (
                        <div key={i} className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
                          <span className="text-[9px] font-mono text-fg3 w-3">{i + 1}</span>
                          <span className="text-[10.5px] text-fg1 truncate flex-1">{t}</span>
                        </div>
                      ))}
                    </div>
                  </WidgetCard>
                </div>
              </div>
            </div>
          </Win>
          <div className="text-[10.5px] text-fg2 leading-[1.5]">Declarative + glue widgets tile a grid. Each is a small card with the shared header. This is the substrate today.</div>
        </div>

        {/* ARROW */}
        <div className="flex flex-col items-center justify-center gap-1.5 self-center">
          <div className="w-9 h-9 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}><I n="maximize" c="w-4 h-4 text-accent" /></div>
          <span className="text-[9px] font-mono text-center leading-[1.3]" style={{ color: "var(--fg3)", width: 60 }}>open an app</span>
        </div>

        {/* RIGHT — an app tab = one artifact, full-bleed */}
        <div className="flex-1 flex flex-col gap-2" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2"><Anno>App tab</Anno><span className="text-[11px] text-fg2">one artifact, full-bleed</span></div>
          <Win>
            <MacBar><CanvasTabStrip active="app" /></MacBar>
            <div className="flex-1 min-h-0 relative" style={{ background: "var(--bg-window)" }}>
              <IframeOrigin port="51847" path="/calendar" />
              <div className="absolute left-0 right-0 bottom-0" style={{ top: 25 }}><CalendarApp /></div>
            </div>
          </Win>
          <div className="text-[10.5px] text-fg2 leading-[1.5]">The same calendar as an <span className="text-accent">app widget</span> fills the whole canvas — one iframe served by its extension. No grid, no card chrome around it.</div>
        </div>
      </div>
    </div>
  );
}

/* ───────── A · Lifecycle states — at full-canvas scale ───────── */
function FullCanvasStates() {
  const Frame = ({ title, children, menu }) => (
    <div className="flex flex-col gap-2" style={{ width: 380 }}>
      <Anno>{title}</Anno>
      <div className="mac-window flex flex-col" style={{ height: 300 }}>
        <MacBar>
          <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full pointer-events-auto" style={{ background: "var(--bg-window)" }}>
              <AppGlyphLocal icon="dumbbell" color="var(--color-green)" size={16} /><span className="text-[10.5px] font-semibold text-fg1">Workouts</span><span className="rounded-full" style={{ width: 5, height: 5, background: "var(--color-green)" }}></span>
            </div>
          </div>
          <button className="text-fg3 p-1 bg-transparent border-none cursor-pointer relative z-10"><I n="more-horizontal" c="w-3.5 h-3.5" /></button>
        </MacBar>
        <div className="flex-1 min-h-0 relative">{children}{menu}</div>
      </div>
    </div>
  );
  return (
    <div className="w-full h-full flex items-start gap-5 p-5 flex-wrap" style={{ background: "var(--bg-window)" }}>
      <Frame title="Cold start — extension booting">
        <SkeletonApp label="Starting workout-cal…" />
      </Frame>

      <Frame title="Error — bridge timeout">
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ background: "var(--bg-window)" }}>
          <div className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "var(--tint-red)" }}><I n="unplug" c="w-6 h-6 text-red" /></div>
          <div className="text-[14px] font-semibold text-fg1">workout-cal stopped responding</div>
          <div className="text-[11px] text-fg2 leading-[1.5]">The extension crashed mid-call. We restarted it — try again?</div>
          <div className="flex items-center gap-2 mt-1">
            <button className="text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full text-white border-none cursor-pointer flex items-center gap-1.5" style={{ background: "var(--color-accent)" }}><I n="rotate-cw" c="w-3 h-3" />Reload</button>
            <button className="text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full text-fg2 bg-transparent cursor-pointer flex items-center gap-1.5" style={{ border: "1px solid var(--stroke-soft)" }}><I n="file-text" c="w-3 h-3" />View logs</button>
          </div>
        </div>
      </Frame>

      <Frame title="⋯ menu — app controls" menu={<AppCardMenu mode="canvas" />}>
        <IframeOrigin port="51847" path="/calendar" />
        <div className="absolute left-0 right-0 bottom-0" style={{ top: 25 }}><CalendarApp compact /></div>
      </Frame>
    </div>
  );
}

/* ───────── B · App as its OWN tab — leave by switching tabs (no back-to-grid) ───────── */
function CanvasMode() {
  return (
    <div className="w-full h-full p-3" style={{ background: "var(--bg-base)" }}>
      <div className="mac-window w-full h-full flex flex-col">
        <MacBar><CanvasTabStrip active="app" /></MacBar>
        <div className="flex-1 min-h-0 relative" style={{ background: "var(--bg-window)" }}>
          {/* The app, full-bleed. No back-to-grid: Workouts IS the active tab — */}
          {/* you leave it by clicking a canvas tab in the strip above. */}
          <div className="absolute inset-0"><CalendarApp /></div>
          <div className="absolute z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ top: 12, left: 12, background: "var(--vibrancy-popover)", backdropFilter: "var(--blur-thin)", border: "1px solid var(--stroke-hairline)" }}>
            <I n="panel-top" c="w-3 h-3 text-fg3" /><span className="text-[10.5px] text-fg2">Its own tab — switch tabs to leave</span>
          </div>
          <ChatLauncher label="Ask gen-app" />
        </div>
      </div>
    </div>
  );
}

/* ───────── B · App LAUNCHED onto a canvas — ephemeral overlay (back-to-grid valid) ───────── */
function CanvasModeLaunched() {
  const glass = { background: "var(--vibrancy-popover)", backdropFilter: "var(--blur-thin)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-2)" };
  return (
    <div className="w-full h-full p-3" style={{ background: "var(--bg-base)" }}>
      <div className="mac-window w-full h-full flex flex-col">
        <MacBar><CanvasTabStrip active="grid" pending /></MacBar>
        <div className="flex-1 min-h-0 relative" style={{ background: "var(--bg-window)" }}>
          <div className="absolute inset-0"><CalendarApp /></div>
          <button className="absolute z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent cursor-pointer" style={{ top: 12, left: 12, ...glass }}>
            <I n="arrow-left" c="w-3.5 h-3.5 text-fg1" /><span className="text-[11.5px] font-semibold text-fg1">Back to grid</span>
            <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-card-elevated)", color: "var(--fg3)" }}>esc</span>
          </button>
          <button className="absolute z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-none cursor-pointer" style={{ top: 12, right: 12, background: "var(--color-accent)", boxShadow: "var(--elev-2)" }}>
            <I n="pin" c="w-3.5 h-3.5 text-white" /><span className="text-[11.5px] font-semibold text-white">Keep as tab</span>
          </button>
          <ChatLauncher label="Ask gen-app" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WidgetCard, AppCardMenu, CanvasModel, FullCanvasStates, CanvasMode, CanvasModeLaunched, ChatLauncher, CanvasTabStrip, AppGlyphLocal });
