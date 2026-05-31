/* AppWidget — the "app widget" substrate (ADR 0006) wired into the kit.

   An app is the third widget kind: a per-extension surface that, unlike a
   declarative or glue widget, is NEVER a card in the grid — it takes the whole
   canvas. Apps are peers of canvases in the tab strip (the "lane"): a canvas
   tab holds a widget grid, an app tab renders one artifact full-bleed.

   This file provides:
     · SEED_APPS + the on-brand app contents (calendar / kanban / notes)
     · AppGlyph         — the squircle app-icon (the "this is an app" signal)
     · AppView          — full-bleed app body + launched-over-canvas chrome
     · LaneTabs         — canvas tabs + app tabs in one lane, overflow + New menu
     · useAppLane()     — apps order (recent-first), active app, ephemeral session
*/

/* ---------- Seed apps (model / settings would emit these) ---------- */
const SEED_APPS = [
  { id: "app-workouts", name: "Workouts", icon: "dumbbell",     color: "var(--color-green)",  view: "calendar", ext: "workout-cal" },
  { id: "app-projects", name: "Projects", icon: "kanban",       color: "var(--color-accent)", view: "kanban",   ext: "projects-board" },
  { id: "app-notes",    name: "Notes",    icon: "notebook-pen", color: "var(--color-purple)", view: "notes",    ext: "notes-app" },
  { id: "app-reading",  name: "Reading",  icon: "book-open",    color: "var(--color-orange)", view: "notes",    ext: "reading-list" },
];

/* ---------- The squircle app-icon ---------- */
function AppGlyph({ icon, color, size = 20 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: `color-mix(in oklab, ${color} 28%, var(--bg-card))`,
      border: `1px solid color-mix(in oklab, ${color} 55%, transparent)`,
      boxShadow: `inset 0 1px 0 color-mix(in oklab, ${color} 35%, transparent)`,
    }}>
      <Icon name={icon} size={Math.round(size * 0.56)} color={color} />
    </span>
  );
}

/* ============================================================
   On-brand app contents — what renders inside the full-bleed app.
   Plain inline styles + tokens (the kit doesn't load Tailwind).
   ============================================================ */

function AppCalendar() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const events = { 4: "var(--color-accent)", 9: "var(--color-green)", 12: "var(--color-orange)", 18: "var(--color-accent)", 23: "var(--color-purple)", 26: "var(--color-green)" };
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-window)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg1)" }}>May 2026</div>
        <span style={{ flex: 1 }}></span>
        <button className="btn btn-icon" style={{ width: 26, height: 26 }}><Icon name="chevron-left" size={15} color="var(--fg2)" /></button>
        <button className="btn btn-icon" style={{ width: 26, height: 26 }}><Icon name="chevron-right" size={15} color="var(--fg2)" /></button>
        <button style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, color: "white", border: "none", cursor: "pointer", background: "var(--color-accent)" }}>Today</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, padding: "10px 12px 0" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg3)" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: 12, flex: 1 }}>
        {days.map((d, i) => {
          const valid = d >= 1 && d <= 31, today = d === 12;
          return (
            <div key={i} style={{
              borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 5, position: "relative",
              background: today ? "var(--color-accent-tint)" : valid ? "var(--bg-card)" : "transparent",
              border: today ? "1px solid var(--color-accent)" : "1px solid transparent",
            }}>
              {valid && <span style={{ fontSize: 12, color: today ? "var(--color-accent)" : "var(--fg1)", fontWeight: today ? 700 : 400 }}>{d}</span>}
              {events[d] && <span style={{ position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 999, background: events[d] }}></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppKanban() {
  const cols = [
    { t: "Backlog", n: 4, c: "var(--fg3)", cards: ["Spike: pdf.js annotations", "Token contract freeze"] },
    { t: "Building", n: 2, c: "var(--color-accent)", cards: ["app-bridge RPC", "host-* SDK"] },
    { t: "Shipped", n: 3, c: "var(--color-green)", cards: ["Loopback iframe"] },
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-window)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg1)" }}>Substrate roadmap</div>
        <span style={{ flex: 1 }}></span>
        <button style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, color: "var(--fg2)", background: "transparent", border: "1px solid var(--stroke-soft)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="plus" size={13} color="var(--fg2)" />Card</button>
      </div>
      <div style={{ display: "flex", gap: 10, padding: 12, flex: 1, minHeight: 0 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, padding: 8, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: col.c }}></span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg1)" }}>{col.t}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg3)" }}>{col.n}</span>
            </div>
            {col.cards.map((card, i) => (
              <div key={i} style={{ borderRadius: 9, padding: 10, fontSize: 12, lineHeight: 1.35, color: "var(--fg1)", background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>{card}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppNotes() {
  const notes = [
    { t: "Bridge failure modes", tag: "arch", c: "var(--color-accent)" },
    { t: "Why same-origin iframe", tag: "decisions", c: "var(--color-purple)" },
    { t: "Token broadcast shape", tag: "theme", c: "var(--color-green)" },
    { t: "Permission layers ×7", tag: "security", c: "var(--color-orange)" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--bg-window)" }}>
      <div style={{ width: "40%", display: "flex", flexDirection: "column", borderRight: "1px solid var(--stroke-hairline)" }}>
        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--stroke-hairline)" }}>
          <Icon name="search" size={13} color="var(--fg3)" /><span style={{ fontSize: 11, color: "var(--fg3)" }}>Search notes</span>
        </div>
        {notes.map((n, i) => (
          <div key={i} style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4, background: i === 0 ? "var(--bg-selected, var(--bg-card))" : "transparent", borderBottom: "1px solid var(--stroke-hairline)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg1)" }}>{n.t}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: n.c }}></span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--fg3)" }}>{n.tag}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg1)" }}>Bridge failure modes</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--fg2)" }}>Every host call passes one chokepoint. Each branch writes a typed bridge_event — denied, invalid, not_ready, timeout, bad_origin, subprocess_died.</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--fg2)" }}>read_bridge_log filters by kind so a debug session asks "show me every denial for this widget" in one call.</div>
      </div>
    </div>
  );
}

const APP_VIEWS = { calendar: AppCalendar, kanban: AppKanban, notes: AppNotes };

/* ---------- Full-bleed app view (replaces the widget grid) ---------- */
/* ---------- App options menu (lives on the served-by hairline) ---------- */
function AppOptionsMenu({ app, onReload, onClose }) {
  const Item = ({ icon, label, hint, danger, onClick }) => (
    <button className="appopts-row" onClick={onClick} style={danger ? { color: "var(--color-red)" } : undefined}>
      <Icon name={icon} size={14} color={danger ? "var(--color-red)" : "var(--fg2)"} />
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {hint && <kbd className="appview-kbd">{hint}</kbd>}
    </button>
  );
  return (
    <div className="appopts-menu">
      <div className="appopts-head">
        <AppGlyph icon={app.icon} color={app.color} size={16} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg1)" }}>{app.name}</span>
        <span style={{ flex: 1 }}></span>
        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--fg3)" }}>{app.ext}</span>
      </div>
      <Item icon="rotate-cw" label="Reload app" onClick={onReload} />
      <Item icon="code-2" label="View source" />
      <Item icon="folder-open" label="Open in editor" />
      <Item icon="shield" label="Permissions" />
      <div className="appopts-sep"></div>
      <Item icon="x" label="Close app" hint="⌘⌫" danger onClick={onClose} />
    </div>
  );
}

/* ---------- Full-bleed app view (replaces the widget grid) ---------- */
function AppView({ app, launchedOver, onBackToGrid, onKeepAsTab, onClose }) {
  const Body = APP_VIEWS[app.view] || AppCalendar;
  const [optsOpen, setOptsOpen] = React.useState(false);
  const [reloading, setReloading] = React.useState(false);
  const optsRef = React.useRef(null);

  React.useEffect(() => {
    if (!optsOpen) return;
    const onDoc = (e) => { if (optsRef.current && !optsRef.current.contains(e.target)) setOptsOpen(false); };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [optsOpen]);

  // close the menu when switching apps
  React.useEffect(() => { setOptsOpen(false); }, [app.id]);

  const reload = () => { setOptsOpen(false); setReloading(true); setTimeout(() => setReloading(false), 600); };

  return (
    <div className="appview">
      {/* served-by-extension hairline — also the home for app options (⋯) */}
      <div className="appview-origin">
        <Icon name="square-dashed" size={11} color="var(--fg3)" />
        <span>iframe · 127.0.0.1 · {app.ext}</span>
        <span style={{ flex: 1 }}></span>
        <Icon name="shield" size={11} color="var(--color-green)" />
        <span style={{ color: "var(--color-green)" }}>sandboxed</span>
        <div ref={optsRef} style={{ position: "relative", display: "inline-flex", marginLeft: 4 }}>
          <button className={`appview-opts ${optsOpen ? "on" : ""}`} onClick={() => setOptsOpen(o => !o)} title="App options">
            <Icon name="more-horizontal" size={12} color={optsOpen ? "var(--color-accent)" : "var(--fg2)"} />
          </button>
          {optsOpen && <AppOptionsMenu app={app} onReload={reload} onClose={onClose} />}
        </div>
      </div>
      <div className="appview-body">{reloading ? <AppReloading /> : <Body />}</div>

      {launchedOver && (
        <>
          <button className="appview-pill appview-pill-left" onClick={onBackToGrid}>
            <Icon name="arrow-left" size={14} color="var(--fg1)" />
            <span>Back to grid</span>
            <kbd className="appview-kbd">esc</kbd>
          </button>
          <button className="appview-pill appview-pill-right" onClick={onKeepAsTab} style={{ background: "var(--color-accent)", border: "none" }}>
            <Icon name="pin" size={14} color="white" />
            <span style={{ color: "white" }}>Keep as tab</span>
          </button>
        </>
      )}
    </div>
  );
}

/* brief reload shimmer so "Reload app" reads as a real action */
function AppReloading() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--bg-window)" }}>
      <span className="appview-spin"><Icon name="loader" size={15} color="var(--fg3)" /></span>
      <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--fg3)" }}>restarting extension…</span>
    </div>
  );
}

/* ---------- The lane: canvas tabs + app tabs in one strip ---------- */
const LANE_MAX_INLINE_APPS = 3;

function LaneTabs({
  canvases, apps, activeId, activeAppId,
  onSwitchCanvas, onNewCanvas, onRenameCanvas, onDeleteCanvas,
  onOpenApp, onCloseApp, onNewApp,
}) {
  const [renaming, setRenaming] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");
  const [overflowOpen, setOverflowOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!overflowOpen && !newOpen) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOverflowOpen(false); setNewOpen(false); } };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [overflowOpen, newOpen]);

  const commit = () => { if (renaming && draftName.trim()) onRenameCanvas(renaming, draftName.trim()); setRenaming(null); };

  const inlineApps = apps.slice(0, LANE_MAX_INLINE_APPS);
  const overflowApps = apps.slice(LANE_MAX_INLINE_APPS);

  return (
    <div className="canvas-tabs" ref={ref}>
      {/* canvas tabs */}
      {canvases.map(c => {
        const on = c.id === activeId && !activeAppId;
        return (
          <div key={c.id}
            className={`canvas-tab ${on ? "on" : ""}`}
            onClick={() => onSwitchCanvas(c.id)}
            onDoubleClick={() => { setRenaming(c.id); setDraftName(c.name); }}
            title={on ? "Double-click to rename" : c.name}
          >
            <Icon name="layout-grid" size={12} color={on ? "var(--fg2)" : "var(--fg3)"} />
            {renaming === c.id ? (
              <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={commit}
                onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setRenaming(null); }}
                className="canvas-tab-input" />
            ) : <span className="canvas-tab-name">{c.name}</span>}
            {canvases.length > 1 && on && (
              <button className="canvas-tab-close" onClick={e => { e.stopPropagation(); onDeleteCanvas(c.id); }} title="Delete canvas">
                <Icon name="x" size={12} color="var(--fg2)" />
              </button>
            )}
          </div>
        );
      })}

      {apps.length > 0 && <div className="lane-divider"></div>}

      {/* app tabs (recent-first, only what fits inline) */}
      {inlineApps.map(a => {
        const on = a.id === activeAppId;
        return (
          <div key={a.id} className={`app-tab ${on ? "on" : ""}`} onClick={() => onOpenApp(a.id)} title={a.name}
            style={on ? { background: `color-mix(in oklab, ${a.color} 15%, transparent)`, borderColor: `color-mix(in oklab, ${a.color} 45%, transparent)` } : undefined}>
            <AppGlyph icon={a.icon} color={a.color} size={18} />
            <span className="app-tab-name" style={{ color: on ? "var(--fg1)" : "var(--fg2)", fontWeight: on ? 600 : 500 }}>{a.name}</span>
            <span className="app-dot" style={{ background: "var(--color-green)" }}></span>
            {on && (
              <button className="canvas-tab-close" onClick={e => { e.stopPropagation(); onCloseApp(); }} title="Close app">
                <Icon name="x" size={12} color="var(--fg2)" />
              </button>
            )}
          </div>
        );
      })}

      {/* overflow ⌄ — only what doesn't fit, recent first */}
      {overflowApps.length > 0 && (
        <div style={{ position: "relative", display: "inline-flex" }}>
          <button className={`lane-of ${overflowOpen ? "on" : ""}`} onClick={() => { setOverflowOpen(o => !o); setNewOpen(false); }} title="More apps">
            <Icon name="chevron-down" size={13} color={overflowOpen ? "var(--color-accent)" : "var(--fg2)"} />
            <span style={{ color: overflowOpen ? "var(--color-accent)" : "var(--fg2)" }}>{overflowApps.length}</span>
          </button>
          {overflowOpen && (
            <div className="lane-menu" style={{ right: "auto", left: 0 }}>
              <div className="lane-menu-head"><span>More apps</span><span className="lane-menu-hint"><Icon name="arrow-down-narrow-wide" size={11} color="var(--fg3)" />recent first</span></div>
              {overflowApps.map(a => (
                <button key={a.id} className="lane-menu-row" onClick={() => { onOpenApp(a.id); setOverflowOpen(false); }}>
                  <AppGlyph icon={a.icon} color={a.color} size={20} />
                  <span style={{ flex: 1, textAlign: "left" }}>{a.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* + New menu — canvas or app */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        <button className="canvas-tab-new" onClick={() => { setNewOpen(o => !o); setOverflowOpen(false); }} title="New">
          <Icon name="plus" size={14} color="var(--fg2)" />
        </button>
        {newOpen && (
          <div className="lane-menu" style={{ left: 0, right: "auto", width: 232 }}>
            <button className="lane-menu-row lane-menu-row-lg" onClick={() => { onNewCanvas(); setNewOpen(false); }}>
              <span className="lane-menu-ic"><Icon name="layout-grid" size={16} color="var(--fg2)" /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>New canvas</span>
                <span style={{ fontSize: 10.5, color: "var(--fg2)", lineHeight: 1.35 }}>A blank grid for live widgets.</span>
              </span>
            </button>
            <div className="lane-menu-sep"></div>
            <button className="lane-menu-row lane-menu-row-lg" onClick={() => { onNewApp(); setNewOpen(false); }}>
              <span className="lane-menu-ic" style={{ background: "var(--color-accent-tint)" }}><Icon name="sparkles" size={16} color="var(--color-accent)" /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>New app</span>
                <span style={{ fontSize: 10.5, color: "var(--fg2)", lineHeight: 1.35 }}>Describe a tool; gen-app builds it as an extension you keep.</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Lane state hook ---------- */
function useAppLane() {
  const [apps, setApps] = React.useState(SEED_APPS);
  const [activeAppId, setActiveAppId] = React.useState(null);
  const [launchedOver, setLaunchedOver] = React.useState(false);

  // open an app — move it to the front (recent-first) and make it active
  const openApp = (id, { ephemeral = false } = {}) => {
    setApps(prev => { const a = prev.find(x => x.id === id); return a ? [a, ...prev.filter(x => x.id !== id)] : prev; });
    setActiveAppId(id);
    setLaunchedOver(ephemeral);
  };
  const closeApp = () => { setActiveAppId(null); setLaunchedOver(false); };
  const keepAsTab = () => setLaunchedOver(false);

  const NEW_APP_SEEDS = [
    { name: "Tracker", icon: "list-checks", color: "var(--color-accent)", view: "kanban", ext: "tracker" },
    { name: "Journal", icon: "notebook-pen", color: "var(--color-purple)", view: "notes", ext: "journal" },
    { name: "Planner", icon: "calendar-days", color: "var(--color-green)", view: "calendar", ext: "planner" },
  ];
  const newApp = (spec) => {
    const seed = spec || NEW_APP_SEEDS[Math.floor(Math.random() * NEW_APP_SEEDS.length)];
    const app = { id: "app-" + Date.now(), ...seed };
    setApps(prev => [app, ...prev]);
    setActiveAppId(app.id);
    setLaunchedOver(false);
    return app;
  };

  const activeApp = apps.find(a => a.id === activeAppId) || null;
  return { apps, activeAppId, activeApp, launchedOver, openApp, closeApp, keepAsTab, newApp };
}

Object.assign(window, { SEED_APPS, AppGlyph, AppView, LaneTabs, useAppLane, AppCalendar, AppKanban, AppNotes });
