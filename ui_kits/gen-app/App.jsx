/* App — state machine that drives the whole click-thru.
   Renders both a Desktop frame AND an iPhone frame side-by-side so the user
   can see the dual form factor in one view. Tweaks toggles demo state.

   v0.5.0 — supports multiple canvases. Each canvas has its own widgets,
   selected[], and chat history. Active canvas index is tracked at the App level.
*/

/* ---------- Seed data (model would emit these) ---------- */
const SEED_WEATHER = { id: "w1", kind: "weather", symbol: "weather", city: "Brooklyn, NY", temp: 68, hi: 72, lo: 58, condition: "Mostly sunny · feels 70°", ago: "3 min" };
const SEED_STOCK   = { id: "w2", kind: "stock",   symbol: "market",  ticker: "AAPL", name: "Apple Inc.", price: 224.18, delta: 2.34, pct: 1.05 };
const SEED_CALENDAR = { id: "w3", kind: "calendar", symbol: "today", date: "Wed 21 May", events: [
  { time: "10:30", title: "Design review" },
  { time: "14:00", title: "Dentist" },
  { time: "18:45", title: "Dinner — Bar Pisellino" },
]};

const SYSTEM_HELLO = { role: "system", content: "Connected to Claude Code · sonnet" };

function makeCanvas(name, widgets = []) {
  return {
    id: "c-" + Math.random().toString(36).slice(2, 8),
    name,
    widgets,
    selected: [],
    messages: [SYSTEM_HELLO],
    sessions: [], // archived chat sessions
  };
}

/* Match a user prompt → a widget spec or a modify intent. */
function routePrompt(text, addressedIds, widgets) {
  const t = text.toLowerCase();
  if (addressedIds && addressedIds.length > 0) return { intent: "modify", ids: addressedIds, text };
  const mentions = [...text.matchAll(/@(\w[\w-]*)/g)].map(m => m[1]);
  if (mentions.length > 0) {
    const targets = widgets.filter(w => mentions.includes(w.symbol));
    if (targets.length > 0) return { intent: "reference", ids: targets.map(w => w.id), mentions, text };
  }
  if (t.includes("weather") || t.includes("forecast") || t.includes("brooklyn")) return { intent: "create", widget: { ...SEED_WEATHER, id: "w-" + Date.now(), symbol: "weather" } };
  if (t.includes("stock") || t.includes("aapl") || t.includes("chart") || t.includes("ticker") || t.includes("market")) return { intent: "create", widget: { ...SEED_STOCK, id: "w-" + Date.now(), symbol: "market" } };
  if (t.includes("calendar") || t.includes("agenda") || t.includes("today")) return { intent: "create", widget: { ...SEED_CALENDAR, id: "w-" + Date.now(), symbol: "today" } };
  return { intent: "unknown" };
}

function aiReplyFor(result, widgets) {
  if (result.intent === "create") {
    const w = result.widget;
    if (w.kind === "weather")  return `Done — pinned ${w.city} weather as @${w.symbol}.`;
    if (w.kind === "stock")    return `Done — ${w.ticker} at $${w.price}, tagged @${w.symbol}.`;
    if (w.kind === "calendar") return `Pinned today's agenda as @${w.symbol}.`;
    return "Done.";
  }
  if (result.intent === "modify") {
    const targets = widgets.filter(w => result.ids.includes(w.id));
    const symbols = targets.map(t => `@${t.symbol || t.kind}`).join(", ");
    return `Updated ${symbols}.`;
  }
  if (result.intent === "reference") return `Reading ${result.mentions.map(m => `@${m}`).join(", ")}…`;
  return "I can build weather, stocks, or calendars right now. Try one of those?";
}

/* ---------- Canvases reducer ---------- */
function useCanvases(seedFirstWith = []) {
  const [canvases, setCanvases] = React.useState(() => [makeCanvas("Canvas 1", seedFirstWith)]);
  const [activeId, setActiveId] = React.useState(() => canvases[0]?.id);

  const active = canvases.find(c => c.id === activeId) || canvases[0];

  // operate on active canvas (immutable update)
  const updateActive = (fn) => setCanvases(prev => prev.map(c => c.id === activeId ? fn(c) : c));

  const select = (id) => updateActive(c => ({ ...c, selected: c.selected.includes(id) ? c.selected.filter(x => x !== id) : [...c.selected, id] }));
  const clearSelected = () => updateActive(c => ({ ...c, selected: [] }));
  const addressInChat = (id) => updateActive(c => ({ ...c, selected: [id] }));

  const send = (text, addressedIds = []) => {
    updateActive(c => ({ ...c, messages: [...c.messages, { role: "user", content: text }, { role: "thinking", content: "asking the model" }] }));
    setTimeout(() => {
      updateActive(c => {
        const result = routePrompt(text, addressedIds, c.widgets);
        const messages = c.messages.filter(m => m.role !== "thinking").concat({ role: "ai", content: aiReplyFor(result, c.widgets) });
        const widgets = result.intent === "create" ? [...c.widgets, { ...result.widget, isNew: true }] : c.widgets;
        const selected = addressedIds.length > 0 ? [] : c.selected;
        return { ...c, messages, widgets, selected };
      });
    }, 900);
  };

  const removeWidget = (id) => updateActive(c => ({
    ...c,
    widgets: c.widgets.filter(w => w.id !== id),
    selected: c.selected.filter(x => x !== id),
    messages: [...c.messages, { role: "system", content: "Widget tossed." }],
  }));

  // Direct message / widget pushes — used by the live-authoring flow, which
  // drives chat + canvas outside the normal routePrompt path.
  const pushUser  = (text) => updateActive(c => ({ ...c, messages: [...c.messages, { role: "user", content: text }] }));
  const pushAgent = (text) => updateActive(c => ({ ...c, messages: [...c.messages, { role: "ai", content: text }] }));
  const addWidget = (w) => updateActive(c => ({ ...c, widgets: [...c.widgets, { ...w, id: w.id || ("w-" + Date.now()), isNew: true }] }));

  const retagWidget = (id) => {
    const w = active.widgets.find(x => x.id === id);
    const next = window.prompt("New @symbol for this widget", w?.symbol || "");
    if (next == null) return;
    const clean = next.trim().replace(/^@/, "").replace(/\s+/g, "-");
    if (!clean) return;
    updateActive(c => ({
      ...c,
      widgets: c.widgets.map(w => w.id === id ? { ...w, symbol: clean } : w),
      messages: [...c.messages, { role: "system", content: `Renamed to @${clean}.` }],
    }));
  };

  // Canvas-level operations
  const newCanvas = (name) => {
    const c = makeCanvas(name || `Canvas ${canvases.length + 1}`);
    setCanvases(prev => [...prev, c]);
    setActiveId(c.id);
  };

  const renameCanvas = (id, name) => setCanvases(prev => prev.map(c => c.id === id ? { ...c, name } : c));

  const deleteCanvas = (id) => {
    if (canvases.length <= 1) return; // never zero
    const remaining = canvases.filter(c => c.id !== id);
    setCanvases(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const clearChat = () => updateActive(c => ({ ...c, messages: [SYSTEM_HELLO], selected: [] }));

  // Archive current chat into sessions, start a fresh one. Only archives
  // if there's an actual user message — empty chats don't pollute history.
  const newSession = () => updateActive(c => {
    const hasContent = c.messages.some(m => m.role === "user");
    const archived = hasContent ? [{
      id: "s-" + Date.now(),
      name: c.messages.find(m => m.role === "user")?.content?.slice(0, 40) || "Untitled session",
      endedAt: Date.now(),
      messages: c.messages,
      msgCount: c.messages.filter(m => m.role === "user" || m.role === "ai").length,
    }] : [];
    return {
      ...c,
      messages: [SYSTEM_HELLO, { role: "system", content: `New session — ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` }],
      selected: [],
      sessions: [...archived, ...c.sessions],
    };
  });

  const restoreSession = (sessionId) => updateActive(c => {
    const s = c.sessions.find(x => x.id === sessionId);
    if (!s) return c;
    // Park the current chat back into sessions first (if it has content),
    // then load the chosen one.
    const hasContent = c.messages.some(m => m.role === "user");
    const parked = hasContent ? [{
      id: "s-" + Date.now(),
      name: c.messages.find(m => m.role === "user")?.content?.slice(0, 40) || "Untitled session",
      endedAt: Date.now(),
      messages: c.messages,
      msgCount: c.messages.filter(m => m.role === "user" || m.role === "ai").length,
    }] : [];
    return {
      ...c,
      messages: s.messages,
      selected: [],
      sessions: [...parked, ...c.sessions.filter(x => x.id !== sessionId)],
    };
  });

  const deleteSession = (sessionId) => updateActive(c => ({
    ...c, sessions: c.sessions.filter(x => x.id !== sessionId),
  }));

  const resetAll = () => { const fresh = makeCanvas("Canvas 1"); setCanvases([fresh]); setActiveId(fresh.id); };

  return {
    canvases, activeId, active, setActiveId,
    // active-canvas surface (matches the old useChatCanvas shape)
    widgets: active.widgets, selected: active.selected, messages: active.messages,
    sessions: active.sessions,
    select, send, clearSelected, removeWidget, addressInChat, retagWidget,
    pushUser, pushAgent, addWidget,
    // canvas-level
    newCanvas, renameCanvas, deleteCanvas, clearChat, newSession, restoreSession, deleteSession, resetAll,
  };
}

/* ---------- Tweaks defaults ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showOnboarding": false,
  "seedCanvas": true,
  "theme": "dark"
}/*EDITMODE-END*/;

/* ---------- Canvas tab strip (desktop) ---------- */
function CanvasTabs({ canvases, activeId, onSwitch, onCreate, onRename, onDelete }) {
  const [renaming, setRenaming] = React.useState(null);
  const [draftName, setDraftName] = React.useState("");

  const commit = () => {
    if (renaming && draftName.trim()) onRename(renaming, draftName.trim());
    setRenaming(null);
  };

  return (
    <div className="canvas-tabs">
      {canvases.map(c => (
        <div
          key={c.id}
          className={`canvas-tab ${c.id === activeId ? "on" : ""}`}
          onClick={() => onSwitch(c.id)}
          onDoubleClick={() => { setRenaming(c.id); setDraftName(c.name); }}
          title={c.id === activeId ? "Double-click to rename" : c.name}
        >
          {renaming === c.id ? (
            <input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setRenaming(null); }}
              className="canvas-tab-input"
            />
          ) : (
            <span className="canvas-tab-name">{c.name}</span>
          )}
          {canvases.length > 1 && c.id === activeId && (
            <button
              className="canvas-tab-close"
              onClick={e => { e.stopPropagation(); onDelete(c.id); }}
              title="Delete canvas"
            ><Icon name="x" size={12} color="var(--fg2)" /></button>
          )}
        </div>
      ))}
      <button className="canvas-tab-new" onClick={onCreate} title="New canvas">
        <Icon name="plus" size={14} color="var(--fg2)" />
      </button>
    </div>
  );
}

/* ---------- iOS canvas dropdown ---------- */
function IOSCanvasMenu({ canvases, activeId, onSwitch, onCreate, onRename, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = canvases.find(c => c.id === activeId);

  const handleRename = () => {
    setOpen(false);
    const next = window.prompt("Rename canvas", active?.name || "");
    if (next == null) return;
    const clean = next.trim();
    if (clean && clean !== active?.name) onRename(activeId, clean);
  };

  const handleDelete = () => {
    setOpen(false);
    if (canvases.length <= 1) return;
    if (window.confirm(`Delete "${active?.name}"? Its widgets and chat will be lost.`)) onDelete(activeId);
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        className="ios-header-canvas"
        onClick={() => setOpen(o => !o)}
      >
        <span>{active?.name || "Canvas"}</span>
        <Icon name="chevron-down" size={14} color="var(--fg2)" />
      </button>
      {open && (
        <div className="ios-canvas-popover">
          <div style={{ fontSize: 10, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, padding: "4px 10px 2px" }}>Switch</div>
          {canvases.map(c => (
            <button key={c.id} className={`ios-canvas-popover-row ${c.id === activeId ? "on" : ""}`} onClick={() => { onSwitch(c.id); setOpen(false); }}>
              <span>{c.name}</span>
              {c.id === activeId && <Icon name="check" size={14} color="var(--color-accent)" />}
            </button>
          ))}
          <div className="ios-canvas-popover-sep"></div>
          <button className="ios-canvas-popover-row" onClick={handleRename}>
            <Icon name="pencil" size={14} color="var(--fg2)" />
            <span>Rename "{active?.name}"</span>
          </button>
          <button className="ios-canvas-popover-row" onClick={() => { onCreate(); setOpen(false); }}>
            <Icon name="plus" size={14} color="var(--color-accent)" />
            <span style={{ color: "var(--color-accent)" }}>New canvas</span>
          </button>
          {canvases.length > 1 && (
            <button className="ios-canvas-popover-row" onClick={handleDelete}>
              <Icon name="trash-2" size={14} color="var(--color-red)" />
              <span style={{ color: "var(--color-red)" }}>Delete "{active?.name}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Desktop side ---------- */
function DesktopApp({ chat, lane, onOpenSettings, onSend, authoring }) {
  const [dockOpen, setDockOpen] = React.useState(true);
  return (
    <DesktopFrame
      title="gen-app"
      toolbarRight={
        <>
          <div className="desktop-rail">
            <span className="crumb">{chat.active.name}</span>
            <span>· {chat.widgets.length} widget{chat.widgets.length === 1 ? "" : "s"}</span>
            {chat.selected.length > 0 ? <span style={{ color: "var(--color-accent)" }}>· {chat.selected.length} selected</span> : null}
          </div>
          <div className="spacer"></div>
          <Button variant="secondary" size="sm" icon="tag">Tag</Button>
          <Button variant="primary"   size="sm" icon="plus">Add widget</Button>
          <button className="btn btn-icon" onClick={onOpenSettings} title="Settings">
            <Icon name="settings" size={18} color="var(--fg2)" />
          </button>
        </>
      }
    >
      <LaneTabs
        canvases={chat.canvases}
        apps={lane.apps}
        activeId={chat.activeId}
        activeAppId={lane.activeAppId}
        onSwitchCanvas={(id) => { lane.closeApp(); chat.setActiveId(id); }}
        onNewCanvas={() => { lane.closeApp(); chat.newCanvas(); }}
        onRenameCanvas={chat.renameCanvas}
        onDeleteCanvas={chat.deleteCanvas}
        onOpenApp={(id) => lane.openApp(id)}
        onCloseApp={lane.closeApp}
        onNewApp={() => lane.newApp()}
      />
      {lane.activeApp
        ? <AppView app={lane.activeApp} launchedOver={lane.launchedOver} onBackToGrid={lane.closeApp} onKeepAsTab={lane.keepAsTab} />
        : <Canvas widgets={chat.widgets} selected={chat.selected} onSelect={chat.select} onDelete={chat.removeWidget} onAddressInChat={chat.addressInChat} onRetag={chat.retagWidget} />}
      <ChatDock
        messages={chat.messages}
        onSend={onSend}
        expanded={dockOpen}
        onToggle={() => setDockOpen(o => !o)}
        addressed={chat.selected}
        widgets={chat.widgets}
        onClearAddressed={chat.clearSelected}
        onClearChat={chat.clearChat}
        onNewSession={chat.newSession}
        sessions={chat.sessions}
        onRestoreSession={chat.restoreSession}
        onDeleteSession={chat.deleteSession}
        contextLabel={lane.activeApp ? lane.activeApp.name : chat.active.name}
      />
      <LiveAuthoringOverlay authoring={authoring} />
    </DesktopFrame>
  );
}

/* ---------- iOS side ---------- */
function IOSApp({ chat, onOpenSettings }) {
  const [dockOpen, setDockOpen] = React.useState(false);
  return (
    <IPhoneFrame>
      <div className="ios-header">
        <IOSCanvasMenu
          canvases={chat.canvases}
          activeId={chat.activeId}
          onSwitch={chat.setActiveId}
          onCreate={() => chat.newCanvas()}
          onRename={chat.renameCanvas}
          onDelete={chat.deleteCanvas}
        />
        <button className="btn btn-icon ios-header-gear" onClick={onOpenSettings} title="Settings">
          <Icon name="settings" size={18} color="var(--fg1)" />
        </button>
      </div>
      <Canvas widgets={chat.widgets} selected={chat.selected} onSelect={chat.select} onDelete={chat.removeWidget} onAddressInChat={chat.addressInChat} onRetag={chat.retagWidget} />
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 18 }}>
        <ChatDock
          messages={chat.messages}
          onSend={chat.send}
          expanded={dockOpen}
          onToggle={() => setDockOpen(o => !o)}
          addressed={chat.selected}
          widgets={chat.widgets}
          onClearAddressed={chat.clearSelected}
          onClearChat={chat.clearChat}
          onNewSession={chat.newSession}
          sessions={chat.sessions}
          onRestoreSession={chat.restoreSession}
          onDeleteSession={chat.deleteSession}
          contextLabel={chat.active.name}
        />
      </div>
    </IPhoneFrame>
  );
}

/* iOS frame wrapper that swaps in IOSSettings when open */
function IOSAppWithSettings({ chat, settingsOpen, onOpenSettings, onCloseSettings }) {
  if (settingsOpen) {
    return (
      <IPhoneFrame>
        <IOSSettings onClose={onCloseSettings} />
      </IPhoneFrame>
    );
  }
  return <IOSApp chat={chat} onOpenSettings={onOpenSettings} />;
}

/* ---------- Root ---------- */
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const seedWidgets = tw.seedCanvas ? [SEED_WEATHER, SEED_STOCK, SEED_CALENDAR] : [];
  const chat = useCanvases(seedWidgets);
  const authoring = useAuthoring();
  const lane = useAppLane();

  // Desktop send: if the prompt needs an extension, run the live-authoring
  // flow (chat lines + floating editor); otherwise the normal chat path.
  const handleSend = (text, addressed = []) => {
    const ext = (!addressed.length && window.matchExtension) ? window.matchExtension(text) : null;
    if (ext) {
      chat.pushUser(text);
      chat.pushAgent(`Drafting an extension — ${ext.folder}. I'll wire it into a widget when it compiles.`);
      authoring.start(ext, () => {
        chat.addWidget(ext.widget);
        chat.pushAgent(`Installed ${ext.id} v0.1.0 · added @${ext.widget.symbol} to the canvas.`);
      });
      return;
    }
    chat.send(text, addressed);
  };

  const [showOnboarding, setShowOnboarding] = React.useState(tw.showOnboarding);
  React.useEffect(() => { setShowOnboarding(tw.showOnboarding); }, [tw.showOnboarding]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", tw.theme || "dark");
  }, [tw.theme]);

  const [settingsOpen, setSettingsOpen] = React.useState(null);

  return (
    <>
      <div className="stage">
        <DesktopApp chat={chat} lane={lane} onSend={handleSend} authoring={authoring} onOpenSettings={() => setSettingsOpen("desktop")} />
        <IOSAppWithSettings
          chat={chat}
          settingsOpen={settingsOpen === "ios"}
          onOpenSettings={() => setSettingsOpen("ios")}
          onCloseSettings={() => setSettingsOpen(null)}
        />
      </div>

      {settingsOpen === "desktop" && <DesktopSettings onClose={() => setSettingsOpen(null)} />}
      {showOnboarding && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div className="mac-window" style={{ width: 480 }}>
            <div className="mac-toolbar">
              <div className="traffic">
                <div className="tl r" onClick={() => setShowOnboarding(false)} style={{ cursor: "pointer" }}></div>
                <div className="tl y"></div><div className="tl g"></div>
              </div>
              <div className="mac-title" style={{ marginLeft: 4 }}>Welcome to gen-app</div>
            </div>
            <Onboarding onFinish={({ sample }) => {
              setShowOnboarding(false); setTweak("showOnboarding", false);
              if (sample === "weather")  chat.send("Weather in Brooklyn", []);
              if (sample === "stock")    chat.send("AAPL stock chart", []);
              if (sample === "calendar") chat.send("Today's agenda", []);
            }} />
          </div>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance">
          <TweakRadio
            label="Theme" value={tw.theme || "dark"}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "auto", label: "Auto" }]}
            onChange={(v) => setTweak("theme", v)}
          />
        </TweakSection>
        <TweakSection label="Demo state">
          <TweakToggle label="Show onboarding overlay" value={tw.showOnboarding} onChange={(v) => setTweak("showOnboarding", v)} />
          <TweakToggle label="Seed canvas with widgets" value={tw.seedCanvas}    onChange={(v) => setTweak("seedCanvas", v)} />
          <TweakButton onClick={chat.resetAll} label="Reset everything" />
        </TweakSection>
        <TweakSection label="Try it">
          <TweakButton onClick={() => chat.newCanvas("Trading")} label="New canvas (Trading)" />
          <TweakButton onClick={() => handleSend("add a hacker news widget", [])} label="Author HN extension (live)" />
          <TweakButton onClick={() => chat.send("@market what's the trend?", [])} label="Send @market mention" />
          <TweakButton onClick={() => chat.send("Add a weather widget for Tokyo", [])} label="Create another widget" />
        </TweakSection>
        <TweakSection label="App widgets">
          <TweakButton onClick={() => lane.openApp("app-workouts")} label="Open Workouts app" />
          <TweakButton onClick={() => lane.openApp("app-projects", { ephemeral: true })} label="Launch Projects over canvas" />
          <TweakButton onClick={() => lane.newApp()} label="New app" />
          <TweakButton onClick={lane.closeApp} label="Back to grid" />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

window.App = App;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
