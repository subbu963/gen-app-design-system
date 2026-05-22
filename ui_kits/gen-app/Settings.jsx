/* Settings — four sections from the spec:
   Providers / Embeddings / Extensions / Logs
   Desktop: split sheet (sidebar + detail), iOS: nav stack with back. */

const PROVIDERS_LIST = [
  { id: "claude-code", name: "Claude Code", sub: "sonnet · local CLI",       bg: "#D97757", glyph: "CC", status: "active",   keyHint: null, isCli: true },
  { id: "groq",        name: "Groq",        sub: "llama-3.3-70b · 0.4s avg", bg: "#FF9F0A", glyph: "G",  status: "ready",    keyHint: "gsk_•••••12c4" },
  { id: "openrouter",  name: "OpenRouter",  sub: "Any model · pay-per-use",  bg: "#5E5CE6", glyph: "OR", status: "ready",    keyHint: "sk-or-•••••a9b2" },
  { id: "openai",      name: "OpenAI",      sub: "gpt-4o · official",        bg: "#10A37F", glyph: "AI", status: "ready",    keyHint: "sk-proj-•••••ff43" },
  { id: "ollama",      name: "Ollama",      sub: "Local · port 11434",       bg: "#30D158", glyph: "●",  status: "offline",  keyHint: null },
];

const EXTENSIONS_LIST = [
  { id: "yahoo",      name: "Yahoo Finance", sub: "Stock data · 15-min delayed",          on: true,  badge: "v0.4.1" },
  { id: "meteo",      name: "Open-Meteo",    sub: "Weather forecasts · 16-day",           on: true,  badge: "v1.2.0" },
  { id: "calendar",   name: "macOS Calendar",sub: "Read-only · today + 7 days",           on: true,  badge: "native" },
  { id: "rss",        name: "RSS",           sub: "Subscribe + summarise feeds",          on: false, badge: "v0.1.0" },
  { id: "github",     name: "GitHub",        sub: "Issues, PRs, repo activity",           on: false, badge: "v0.2.3" },
  { id: "hackernews", name: "Hacker News",   sub: "Front page · top stories",             on: false, badge: "v0.1.2" },
];

const LOGS_SEED = [
  { t: "09:41:22.014", lvl: "info",  src: "chat",      msg: "→ groq · llama-3.3-70b · 412 tokens" },
  { t: "09:41:22.428", lvl: "info",  src: "chat",      msg: "← tool_call: create_widget(weather, brooklyn)" },
  { t: "09:41:22.430", lvl: "info",  src: "widget",    msg: "spawn @weather (id w-1747824082)" },
  { t: "09:41:22.512", lvl: "info",  src: "ext:meteo", msg: "GET /v1/forecast?lat=40.6782&lon=-73.9442 · 200 · 88 ms" },
  { t: "09:41:22.601", lvl: "info",  src: "widget",    msg: "@weather render · 68°F · sunny" },
  { t: "09:42:17.882", lvl: "warn",  src: "ext:yahoo", msg: "rate-limit: backing off 30s" },
  { t: "09:42:48.103", lvl: "info",  src: "ext:yahoo", msg: "resumed" },
  { t: "09:43:02.044", lvl: "error", src: "embed",     msg: "local llama.cpp · timeout after 5000ms" },
];

/* ---------- Providers panel ---------- */
function ProvidersPanel() {
  const [active, setActive] = React.useState("claude-code");
  const [selected, setSelected] = React.useState("claude-code");
  const [budget, setBudget] = React.useState(20);
  const p = PROVIDERS_LIST.find(x => x.id === selected) || PROVIDERS_LIST[0];

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label">Available</div>
        <div className="list">
          {PROVIDERS_LIST.map(prov => (
            <div
              key={prov.id}
              className={`list-row ${selected === prov.id ? "list-row-on" : ""}`}
              onClick={() => setSelected(prov.id)}
            >
              <div className="row-ic" style={{ background: prov.bg }}>{prov.glyph}</div>
              <div className="row-body">
                <div className="row-title">{prov.name}</div>
                <div className="row-sub">{prov.sub}</div>
              </div>
              <div className="row-right">
                {active === prov.id
                  ? <span className="symbol-chip" style={{ background: "var(--tint-green)", color: "var(--color-green)", borderColor: "transparent" }}>active</span>
                  : prov.status === "offline"
                    ? <span className="muted" style={{ fontSize: 12 }}>offline</span>
                    : <span className="muted" style={{ fontSize: 12 }}>ready</span>
                }
              </div>
            </div>
          ))}
        </div>
        <div className="footnote" style={{ marginTop: 8 }}>
          Exactly one runs the chat at a time. The rest stay configured.
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{p.name} details</div>
        <div className="list">
          {p.keyHint && (
            <div className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name="key" size={14} color="var(--fg2)" />
              </div>
              <div className="row-body">
                <div className="row-title" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{p.keyHint}</div>
                <div className="row-sub">Stored in OS keychain</div>
              </div>
              <div className="row-right">
                <span className="symbol-chip" style={{ background: "transparent", borderColor: "var(--stroke-soft)", color: "var(--fg2)" }}>Replace</span>
              </div>
            </div>
          )}
          {p.isCli && (
            <div className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name="terminal" size={14} color="var(--color-green)" />
              </div>
              <div className="row-body">
                <div className="row-title" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>claude</div>
                <div className="row-sub">v1.2.4 · authenticated as <span style={{ color: "var(--fg1)" }}>you@anthropic</span></div>
              </div>
              <div className="row-right">
                <span className="symbol-chip" style={{ background: "var(--tint-green)", color: "var(--color-green)", borderColor: "transparent" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--color-green)", marginRight: 4 }}></span>installed
                </span>
              </div>
            </div>
          )}
          <div className="list-row">
            <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
              <Icon name="cpu" size={14} color="var(--fg2)" />
            </div>
            <div className="row-body">
              <div className="row-title">Model</div>
              <div className="row-sub">{p.sub.split(" · ")[0]}</div>
            </div>
            <div className="row-right"><Icon name="chevron-right" size={16} color="var(--fg3)" /></div>
          </div>
        </div>
        {p.isCli && (
          <Button variant="secondary" size="sm" icon="terminal" style={{ marginTop: 10, alignSelf: "flex-start" }}>
            Check CLI
          </Button>
        )}
        {p.id !== active && p.status !== "offline" && (
          <Button variant="primary" size="md" style={{ marginTop: 12 }} onClick={() => setActive(p.id)}>
            Make {p.name} active
          </Button>
        )}
      </div>

      {p.isCli && (
        <div className="settings-section">
          <div className="settings-section-label">Request budget</div>
          <div className="list">
            <div className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name="wallet" size={14} color="var(--color-yellow)" />
              </div>
              <div className="row-body">
                <div className="row-title">Daily ceiling</div>
                <div className="row-sub">Stops Claude Code from racking up surprise tokens</div>
              </div>
              <div className="row-right" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg1)" }}>${budget}.00</div>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--stroke-hairline)" }}>
              <input type="range" min="1" max="100" value={budget} onChange={e => setBudget(+e.target.value)}
                style={{ flex: 1, accentColor: "var(--color-accent)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)", minWidth: 60, textAlign: "right" }}>$1 — $100</span>
            </div>
          </div>
          <div className="footnote" style={{ marginTop: 8 }}>
            Used <span style={{ color: "var(--fg1)", fontFamily: "var(--font-mono)" }}>$3.24</span> today · resets at midnight local time.
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Embeddings panel ---------- */
function EmbeddingsPanel() {
  const [mode, setMode] = React.useState("local");
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label">Engine</div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "local",  label: "Local · llama.cpp" },
            { value: "remote", label: "Remote · OpenAI" },
          ]}
        />
        <div className="footnote" style={{ marginTop: 10 }}>
          Embeddings power widget search and "find similar". They never leave this device when running locally.
        </div>
      </div>
      {mode === "local" ? (
        <div className="settings-section">
          <div className="settings-section-label">llama.cpp</div>
          <div className="list">
            <div className="list-row">
              <div className="row-ic" style={{ background: "var(--color-green)" }}>●</div>
              <div className="row-body">
                <div className="row-title">nomic-embed-text-v1.5</div>
                <div className="row-sub" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>~/.gen-app/models/nomic-embed.gguf · 137 MB</div>
              </div>
              <div className="row-right">
                <span className="symbol-chip" style={{ background: "var(--tint-green)", color: "var(--color-green)", borderColor: "transparent" }}>loaded</span>
              </div>
            </div>
            <div className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name="hard-drive" size={14} color="var(--fg2)" />
              </div>
              <div className="row-body">
                <div className="row-title">Cache</div>
                <div className="row-sub">214 embeddings · 1.8 MB</div>
              </div>
              <div className="row-right">
                <span className="symbol-chip" style={{ background: "transparent", borderColor: "var(--stroke-soft)", color: "var(--fg2)" }}>Purge</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-section">
          <div className="settings-section-label">OpenAI embeddings</div>
          <div className="field" style={{ marginTop: 4 }}>
            <label className="field-label">Model</label>
            <input className="field-input" defaultValue="text-embedding-3-small" readOnly style={{ fontFamily: "var(--font-mono)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Extensions panel — now with author/edit affordances ---------- */
function ExtensionsPanel() {
  const [state, setState] = React.useState(() => Object.fromEntries(EXTENSIONS_LIST.map(e => [e.id, e.on])));
  const [editing, setEditing] = React.useState(null);
  const onCount = Object.values(state).filter(Boolean).length;
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{onCount} of {EXTENSIONS_LIST.length} on</span>
          <div className="row" style={{ gap: 6 }}>
            <Button variant="secondary" size="sm" icon="upload">Import…</Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setEditing({ name: "New extension", code: "" })}>Create new</Button>
          </div>
        </div>
        <div className="list">
          {EXTENSIONS_LIST.map(ext => (
            <div key={ext.id} className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name="puzzle" size={14} color="var(--fg2)" />
              </div>
              <div className="row-body">
                <div className="row-title">{ext.name}</div>
                <div className="row-sub">{ext.sub}</div>
              </div>
              <div className="row" style={{ gap: 10, alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>{ext.badge}</span>
                <button className="btn btn-icon" onClick={() => setEditing({ id: ext.id, name: ext.name })} title="Edit">
                  <Icon name="code" size={14} color="var(--fg2)" />
                </button>
                <Toggle on={state[ext.id]} onChange={(v) => setState(s => ({ ...s, [ext.id]: v }))} />
              </div>
            </div>
          ))}
        </div>
        <div className="footnote" style={{ marginTop: 8 }}>
          Extensions run in sandboxed workers. Their data flows to widgets via declarative specs.
          See <code className="code">extension-manifest.d.ts</code> for the TypeScript schema.
        </div>
      </div>
      {editing && <ExtensionEditor extension={editing} onClose={() => setEditing(null)} onSave={() => setEditing(null)} />}
    </div>
  );
}

/* ---------- Logs panel ---------- */
function LogsPanel() {
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Live · last 30 min</span>
          <span style={{ display: "flex", gap: 6 }}>
            <span className="symbol-chip" style={{ background: "var(--tint-green)", color: "var(--color-green)", borderColor: "transparent" }}>info 6</span>
            <span className="symbol-chip" style={{ background: "var(--tint-orange)", color: "var(--color-orange)", borderColor: "transparent" }}>warn 1</span>
            <span className="symbol-chip" style={{ background: "var(--tint-red)", color: "var(--color-red)", borderColor: "transparent" }}>err 1</span>
          </span>
        </div>
        <div className="logs">
          {LOGS_SEED.map((line, i) => (
            <div key={i} className={`log-row log-${line.lvl}`}>
              <span className="log-t">{line.t}</span>
              <span className={`log-lvl log-lvl-${line.lvl}`}>{line.lvl.toUpperCase()}</span>
              <span className="log-src">{line.src}</span>
              <span className="log-msg">{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Appearance panel ---------- */
function AppearancePanel() {
  // Read current theme from html attr; on change, set it AND broadcast to the host so it persists.
  const [theme, setTheme] = React.useState(() => document.documentElement.getAttribute("data-theme") || "dark");
  const apply = (v) => {
    setTheme(v);
    document.documentElement.setAttribute("data-theme", v);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { theme: v } }, "*");
  };
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label">Theme</div>
        <Segmented
          value={theme}
          onChange={apply}
          options={[
            { value: "light", label: "Light" },
            { value: "dark",  label: "Dark" },
            { value: "auto",  label: "Auto" },
          ]}
        />
        <div className="footnote" style={{ marginTop: 10 }}>
          <strong style={{ color: "var(--fg1)" }}>Auto</strong> follows your OS appearance setting and switches at sundown / sunrise on iOS.
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-section-label">Preview</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{
            flex: 1, padding: 14, borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)", border: "1px solid var(--stroke-soft)"
          }}>
            <div style={{ fontSize: 11, color: "var(--fg2)", marginBottom: 6 }}>AAPL · sample</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--fg1)", letterSpacing: "-0.02em" }}>$224.18</div>
            <div style={{ fontSize: 12, color: "var(--color-green)", fontWeight: 600 }}>▲ +2.34</div>
          </div>
          <div style={{
            flex: 1, padding: 14, borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)", border: "1px solid var(--stroke-soft)"
          }}>
            <div style={{ fontSize: 11, color: "var(--fg2)", marginBottom: 6 }}>Buttons</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="symbol-chip">@market</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section index ---------- */
const SECTIONS = [
  { id: "appearance", name: "Appearance", iosName: "Looks",   icon: "sun",       bg: "var(--color-orange)",   sub: "Dark",                 Panel: AppearancePanel },
  { id: "providers",  name: "Providers",  iosName: "Brains",  icon: "cpu",       bg: "var(--color-accent)",   sub: "Groq · active",      Panel: ProvidersPanel },
  { id: "embeddings", name: "Embeddings", iosName: "Senses",  icon: "network",   bg: "var(--color-teal)",     sub: "Local · llama.cpp",  Panel: EmbeddingsPanel },
  { id: "extensions", name: "Extensions", iosName: "Powers",  icon: "puzzle",    bg: "var(--color-purple)",   sub: "3 of 6 on",          Panel: ExtensionsPanel },
  { id: "secrets",    name: "Secrets",    iosName: "Vault",   icon: "key",       bg: "var(--color-yellow)",   sub: "4 in keychain",        Panel: SecretsPanel },
  { id: "logs",       name: "Logs",       iosName: "Diaries", icon: "file-text", bg: "var(--fg2)",            sub: "Live · 8 events",    Panel: LogsPanel },
];

/* ---------- Desktop settings (split sheet) ---------- */
function DesktopSettings({ onClose }) {
  const [sectionId, setSectionId] = React.useState("appearance");
  const section = SECTIONS.find(s => s.id === sectionId);
  const Panel = section.Panel;
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-sheet desktop" onClick={e => e.stopPropagation()}>
        <div className="settings-side">
          <div className="settings-side-head">Settings</div>
          {SECTIONS.map(s => (
            <div
              key={s.id}
              className={`settings-side-row ${sectionId === s.id ? "on" : ""}`}
              onClick={() => setSectionId(s.id)}
            >
              <div className="row-ic" style={{ background: s.bg, width: 22, height: 22, borderRadius: 6 }}>
                <Icon name={s.icon} size={12} color="white" />
              </div>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
        <div className="settings-main">
          <div className="settings-main-head">
            <div className="h3">{section.name}</div>
            <button className="btn btn-icon" onClick={onClose}>
              <Icon name="x" size={16} color="var(--fg2)" />
            </button>
          </div>
          <div className="settings-main-body">
            <Panel />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- iOS settings (nav stack) ---------- */
function IOSSettings({ onClose }) {
  const [sectionId, setSectionId] = React.useState(null);

  // Root list
  if (!sectionId) {
    return (
      <div className="ios-settings">
        <div className="ios-nav">
          <button className="btn btn-icon" onClick={onClose}>
            <Icon name="x" size={18} color="var(--color-accent)" />
          </button>
          <div className="ios-nav-ttl">Settings</div>
          <div style={{ width: 32 }} />
        </div>
        <div className="ios-settings-body">
          <div className="list">
            {SECTIONS.map(s => (
              <div key={s.id} className="list-row" onClick={() => setSectionId(s.id)}>
                <div className="row-ic" style={{ background: s.bg }}>
                  <Icon name={s.icon} size={14} color="white" />
                </div>
                <div className="row-body">
                  <div className="row-title">{s.iosName}</div>
                  <div className="row-sub">{s.sub}</div>
                </div>
                <div className="row-right"><Icon name="chevron-right" size={16} color="var(--fg3)" /></div>
              </div>
            ))}
          </div>
          <div className="footnote" style={{ marginTop: 14, textAlign: "center" }}>
            <span className="brand-display" style={{ fontSize: 16 }}>gen·app</span> · v0.1.0
          </div>
        </div>
      </div>
    );
  }

  // Detail page
  const section = SECTIONS.find(s => s.id === sectionId);
  const Panel = section.Panel;
  return (
    <div className="ios-settings">
      <div className="ios-nav">
        <button className="btn btn-icon" onClick={() => setSectionId(null)}>
          <Icon name="chevron-left" size={18} color="var(--color-accent)" />
        </button>
        <div className="ios-nav-ttl">{section.iosName}</div>
        <div style={{ width: 32 }} />
      </div>
      <div className="ios-settings-body">
        <Panel />
      </div>
    </div>
  );
}

Object.assign(window, { DesktopSettings, IOSSettings, SECTIONS, PROVIDERS_LIST, EXTENSIONS_LIST, LOGS_SEED });
