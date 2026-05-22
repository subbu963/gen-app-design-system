/* App — state machine that drives the whole click-thru.
   Renders both a Desktop frame AND an iPhone frame side-by-side so the user
   can see the dual form factor in one view.  The Tweaks panel toggles which
   iOS dock variant is shown. */

/* ---------- Seed data (model would emit these) ---------- */
const SEED_WEATHER = { id: "w1", kind: "weather", symbol: "weather", city: "Brooklyn, NY", temp: 68, hi: 72, lo: 58, condition: "Mostly sunny · feels 70°", ago: "3 min" };
const SEED_STOCK   = { id: "w2", kind: "stock",   symbol: "market",  ticker: "AAPL", name: "Apple Inc.", price: 224.18, delta: 2.34, pct: 1.05 };
const SEED_CALENDAR = { id: "w3", kind: "calendar", symbol: "today", date: "Wed 21 May", events: [
  { time: "10:30", title: "Design review" },
  { time: "14:00", title: "Dentist" },
  { time: "18:45", title: "Dinner — Bar Pisellino" },
]};

/* Match a user prompt → a widget spec or a modify intent. */
function routePrompt(text, addressedIds, widgets) {
  const t = text.toLowerCase();
  // Modify intent — addressed widgets exist
  if (addressedIds && addressedIds.length > 0) {
    return { intent: "modify", ids: addressedIds, text };
  }
  // Symbol reference in the text (e.g. "summarize @market")
  const mentions = [...text.matchAll(/@(\w[\w-]*)/g)].map(m => m[1]);
  if (mentions.length > 0) {
    const targets = widgets.filter(w => mentions.includes(w.symbol));
    if (targets.length > 0) return { intent: "reference", ids: targets.map(w => w.id), mentions, text };
  }
  // Create intent — keyword routing
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
  if (result.intent === "reference") {
    return `Reading ${result.mentions.map(m => `@${m}`).join(", ")}…`;
  }
  return "I can build weather, stocks, or calendars right now. Try one of those?";
}

/* ---------- Reducer ---------- */
function useChatCanvas(initialWidgets = []) {
  const [widgets, setWidgets] = React.useState(initialWidgets);
  const [selected, setSelected] = React.useState([]);
  const [messages, setMessages] = React.useState([
    { role: "system", content: "Connected to Groq · llama-3.3-70b" },
  ]);

  const select = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const send = (text, addressedIds = []) => {
    setMessages(prev => [...prev, { role: "user", content: text }, { role: "thinking", content: "asking the model" }]);
    setTimeout(() => {
      // capture current widgets at fire-time
      setWidgets(prevWidgets => {
        const result = routePrompt(text, addressedIds, prevWidgets);
        setMessages(prev => prev.filter(m => m.role !== "thinking").concat({ role: "ai", content: aiReplyFor(result, prevWidgets) }));
        if (result.intent === "create") return [...prevWidgets, { ...result.widget, isNew: true }];
        return prevWidgets;
      });
      // clear selection after a modify/reference
      if (addressedIds.length > 0) setSelected([]);
    }, 900);
  };

  const clearSelected = () => setSelected([]);

  const reset = () => { setWidgets([]); setMessages([{ role: "system", content: "Connected to Groq · llama-3.3-70b" }]); setSelected([]); };

  const removeWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSelected(prev => prev.filter(x => x !== id));
    setMessages(prev => [...prev, { role: "system", content: "Widget tossed." }]);
  };

  const addressInChat = (id) => {
    setSelected([id]);
  };

  const retagWidget = (id) => {
    const w = widgets.find(x => x.id === id);
    const next = window.prompt("New @symbol for this widget", w?.symbol || "");
    if (next == null) return;
    const clean = next.trim().replace(/^@/, "").replace(/\s+/g, "-");
    if (!clean) return;
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, symbol: clean } : w));
    setMessages(prev => [...prev, { role: "system", content: `Renamed to @${clean}.` }]);
  };

  return { widgets, selected, messages, select, send, reset, clearSelected, removeWidget, addressInChat, retagWidget };
}

/* ---------- Tweaks defaults ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showOnboarding": false,
  "seedCanvas": true,
  "theme": "dark"
}/*EDITMODE-END*/;

/* ---------- Desktop side ---------- */
function DesktopApp({ chat, onOpenSettings }) {
  const [dockOpen, setDockOpen] = React.useState(true);
  return (
    <DesktopFrame
      title="gen-app"
      toolbarRight={
        <>
          <div className="desktop-rail">
            <span className="crumb">Canvas</span>
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
      <Canvas widgets={chat.widgets} selected={chat.selected} onSelect={chat.select} onDelete={chat.removeWidget} onAddressInChat={chat.addressInChat} onRetag={chat.retagWidget} />
      <ChatDock
        messages={chat.messages}
        onSend={chat.send}
        expanded={dockOpen}
        onToggle={() => setDockOpen(o => !o)}
        addressed={chat.selected}
        widgets={chat.widgets}
        onClearAddressed={chat.clearSelected}
      />
    </DesktopFrame>
  );
}

/* ---------- iOS side ---------- */
function IOSApp({ chat, onOpenSettings }) {
  const [dockOpen, setDockOpen] = React.useState(false);
  return (
    <IPhoneFrame>
      {/* iOS-style header bar with title + settings gear */}
      <div className="ios-header">
        <div className="ios-header-ttl">Canvas</div>
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

function IOSSettings() {
  return (
    <div style={{ padding: 16, overflowY: "auto" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--fg1)", marginBottom: 16, letterSpacing: "-0.02em" }}>Settings</div>
      <div className="list" style={{ marginBottom: 14 }}>
        <ListRow icon={<Icon name="cpu" size={16} color="white" />} iconBg="var(--color-accent)" title="Brains" sub="Groq · active" />
        <ListRow icon={<Icon name="network" size={16} color="white" />} iconBg="var(--color-teal)" title="Senses" sub="Local embeddings" />
        <ListRow icon={<Icon name="puzzle" size={16} color="white" />} iconBg="var(--color-purple)" title="Powers" sub="3 of 6 on" />
        <ListRow icon={<Icon name="file-text" size={16} color="white" />} iconBg="var(--fg2)" title="Diaries" sub="Logs · 1.2 MB" />
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const seedWidgets = tw.seedCanvas ? [SEED_WEATHER, SEED_STOCK, SEED_CALENDAR] : [];
  // share state across both frames so they animate together
  const chat = useChatCanvas(seedWidgets);

  const [showOnboarding, setShowOnboarding] = React.useState(tw.showOnboarding);
  React.useEffect(() => { setShowOnboarding(tw.showOnboarding); }, [tw.showOnboarding]);

  // theme — apply data-theme to <html> so the CSS vars switch
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", tw.theme || "dark");
  }, [tw.theme]);

  // settings: 'desktop' (full sheet) | 'ios' (mounted inside iPhone) | null
  const [settingsOpen, setSettingsOpen] = React.useState(null);

  return (
    <>
      <div className="stage">
        <DesktopApp chat={chat} onOpenSettings={() => setSettingsOpen("desktop")} />
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
              // if user picked a sample, drop it on the canvas
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
          <TweakButton onClick={chat.reset} label="Reset canvas + chat" />
        </TweakSection>
        <TweakSection label="Try it">
          <TweakButton onClick={() => chat.send("@market what's the trend?", [])} label="Send @market mention" />
          <TweakButton onClick={() => chat.send("Add a weather widget for Tokyo", [])} label="Create another widget" />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

window.App = App;

/* Mount */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
