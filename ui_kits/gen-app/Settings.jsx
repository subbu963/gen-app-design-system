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

/* Runtime + status atoms — inline so this file stays self-contained.
   See preview/extension-runtime-detail.html for the canonical spec. */
function RuntimeChip({ runtime }) {
  if (!runtime) return null;
  const map = {
    worker: { bg: "var(--bg-card-elevated)", color: "var(--fg2)",         border: "1px solid var(--stroke-soft)" },
    deno:   { bg: "rgba(48,209,88,0.14)",    color: "var(--color-green)",  border: "1px solid transparent" },
    child:  { bg: "rgba(94,92,230,0.18)",    color: "var(--color-indigo)", border: "1px solid transparent" },
  };
  const s = map[runtime];
  if (!s) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 999,
      fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.02em",
      background: s.bg, color: s.color, border: s.border,
    }}>{runtime}</span>
  );
}

function StatusDot({ state }) {
  if (!state) return null;
  const map = {
    running: { bg: "var(--color-green)", label: "running" },
    idle:    { bg: "var(--fg3)",         label: "idle" },
    stopped: { bg: "var(--fg4)",         label: "stopped" },
    crashed: { bg: "var(--color-red)",   label: "backing off" },
  };
  const s = map[state];
  if (!s) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg2)" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.bg }}></span>
      {s.label}
    </span>
  );
}

/* Extensions panel — three sections (bundled, user, MCP), each with its own
   list shape. Mirrors apps/desktop/src/settings/SettingsSheet.tsx.
   Runtime field is the worker/deno discriminator (see ADR 0001). */
const BUNDLED_EXTS = [
  { id: "open-meteo", name: "Open-Meteo", description: "Weather forecasts · 16-day · 4 providers", version: "2.1.0", runtime: "deno", status: "running" },
  { id: "clock",      name: "Clock",      description: "Local + world clocks · 2 providers",         version: "0.2.0", runtime: "deno", status: "running" },
];

const USER_EXTS = [
  { id: "rss",       name: "RSS",         description: "Subscribe + summarise feeds",                  enabled: true,  runtime: "worker" },
  { id: "portfolio", name: "Portfolio",   description: "yahoo-finance + holdings",                      enabled: false, runtime: "worker" },
  { id: "notes-idx", name: "Notes index", description: "PGlite · 14 MB on disk · last call 23m ago",   enabled: true,  runtime: "deno", status: "idle" },
];

const MCP_EXTS = [
  {
    id: "mcp.modelcontextprotocol-server-filesystem",
    name: "Filesystem",
    npmPackage: "@modelcontextprotocol/server-filesystem",
    version: "0.5.2",
    kind: "stdio",
    auth: { kind: "none" },
    enabled: true,
    tools: 3,
  },
  {
    id: "mcp.linear-app",
    name: "Linear",
    npmPackage: "https://mcp.linear.app/sse",
    version: "0.0.0",
    kind: "http",
    auth: { kind: "oauth", issuer: "https://mcp.linear.app", scopes: ["read", "write"] },
    enabled: false,
    tools: 11,
  },
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

/* ---------- Extensions panel — three sections, mirrors SettingsSheet.tsx ---------- */
function ExtensionsPanel() {
  const [disabled, setDisabled]   = React.useState(() => new Set());
  const [userOn, setUserOn]       = React.useState(() => Object.fromEntries(USER_EXTS.map(e => [e.id, e.enabled])));
  const [mcpOn, setMcpOn]         = React.useState(() => Object.fromEntries(MCP_EXTS.map(e => [e.id, e.enabled])));
  const [editing, setEditing]     = React.useState(null);
  const [installing, setInstalling] = React.useState(false);
  const [viewingTools, setViewingTools] = React.useState(null);
  const [editingMcp, setEditingMcp] = React.useState(null);
  const [chooserOpen, setChooserOpen] = React.useState(false);

  const toggleBundled = (id, on) => {
    setDisabled(s => {
      const next = new Set(s);
      if (on) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="settings-panel">

      {/* ───── Bundled ───── */}
      <div className="settings-section">
        <div className="settings-section-label">Bundled</div>
        <div className="list">
          {BUNDLED_EXTS.map(ext => (
            <div key={ext.id} className="list-row" style={{ cursor: "default" }}>
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name={ext.id === "clock" ? "clock" : "cloud-sun"} size={14} color={ext.id === "clock" ? "var(--color-cyan)" : "var(--color-yellow)"} />
              </div>
              <div className="row-body">
                <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span>{ext.name}</span>
                  <RuntimeChip runtime={ext.runtime} />
                  <StatusDot state={ext.status} />
                </div>
                <div className="row-sub">{ext.description}</div>
              </div>
              <div className="row" style={{ alignItems: "center", gap: 10 }}>
                <span className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>v{ext.version}</span>
                <Toggle on={!disabled.has(ext.id)} onChange={(v) => toggleBundled(ext.id, v)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───── User-authored ───── */}
      <div className="settings-section">
        <div className="settings-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Your extensions · {USER_EXTS.length}</span>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setChooserOpen(true)}>
            New extension
          </Button>
        </div>
        {USER_EXTS.length === 0 ? (
          <div className="footnote">
            None yet. Author one in JavaScript — it pulls data and feeds widgets, sandboxed like the bundled extensions.
          </div>
        ) : (
          <div className="list">
            {USER_EXTS.map(rec => (
              <div key={rec.id} className="list-row" style={{ cursor: "default" }}>
                <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                  <Icon name="puzzle" size={14} color="var(--color-purple)" />
                </div>
                <div className="row-body">
                  <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{rec.name}</span>
                    <RuntimeChip runtime={rec.runtime} />
                    {rec.status && <StatusDot state={rec.status} />}
                  </div>
                  <div className="row-sub">
                    {rec.description}
                    {rec.runtime === "worker" && (
                      <span style={{ color: "var(--fg3)" }}> · iOS-safe</span>
                    )}
                  </div>
                </div>
                <div className="row" style={{ alignItems: "center", gap: 4 }}>
                  <button className="btn btn-icon" onClick={() => setEditing(rec)} title="Edit extension">
                    <Icon name="code" size={14} color="var(--fg2)" />
                  </button>
                  <button className="btn btn-icon" title="Delete extension">
                    <Icon name="trash-2" size={14} color="var(--color-red)" />
                  </button>
                  <Toggle on={userOn[rec.id]} onChange={(v) => setUserOn(s => ({ ...s, [rec.id]: v }))} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="footnote">
          Worker extensions run in a sandboxed webview worker (iOS-safe). Deno extensions run as long-lived <code className="code">deno run</code> subprocesses with explicit <code className="code">--allow-*</code> flags (desktop only).
        </div>
      </div>

      {/* ───── MCP servers ───── */}
      <div className="settings-section">
        <div className="settings-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>MCP servers · {MCP_EXTS.length}</span>
          <Button variant="primary" size="sm" icon="package" onClick={() => setInstalling(true)}>
            Install MCP server
          </Button>
        </div>
        {MCP_EXTS.length === 0 ? (
          <div className="footnote">
            None yet. Install a Model Context Protocol server — from npm (e.g. <code className="code">@modelcontextprotocol/server-filesystem</code>) or a remote URL (e.g. <code className="code">https://mcp.linear.app/sse</code>). Its tools become providers the chat can call from any widget.
          </div>
        ) : (
          <div className="list">
            {MCP_EXTS.map(rec => {
              const authKind = (rec.auth && rec.auth.kind) || "none";
              return (
                <div key={rec.id} className="list-row" style={{ cursor: "default" }}>
                  <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                    <Icon name="package" size={14} color="var(--color-indigo)" />
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{rec.name}</span>
                      {rec.kind === "stdio" && <RuntimeChip runtime="child" />}
                      {rec.kind === "stdio" && mcpOn[rec.id] && <StatusDot state="running" />}
                    </div>
                    <div className="row-sub" style={{ fontFamily: "var(--font-mono)" }}>
                      {rec.npmPackage} · {rec.tools} tools
                    </div>
                  </div>
                  <div className="row" style={{ alignItems: "center", gap: 10 }}>
                    <span className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      v{rec.version || "0.0.0"} · {rec.kind} · {authKind}
                    </span>
                    {authKind === "oauth" && (
                      <button className="btn btn-icon" title="Re-authorize">
                        <Icon name="key-round" size={14} color="var(--fg2)" />
                      </button>
                    )}
                    <button className="btn btn-icon" onClick={() => setEditingMcp(rec)} title="Edit args / endpoint">
                      <Icon name="pencil" size={14} color="var(--fg2)" />
                    </button>
                    <button className="btn btn-icon" onClick={() => setViewingTools(rec)} title="View tools">
                      <Icon name="file-text" size={14} color="var(--fg2)" />
                    </button>
                    <button className="btn btn-icon" title="Uninstall">
                      <Icon name="trash-2" size={14} color="var(--color-red)" />
                    </button>
                    <Toggle on={mcpOn[rec.id]} onChange={(v) => setMcpOn(s => ({ ...s, [rec.id]: v }))} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="footnote">
          stdio servers spawn locally (<code className="code">npx -y &lt;package&gt;</code>) and run as your user — review the package before installing. Remote servers talk Streamable HTTP; auth tokens live in the keychain. Desktop only.
        </div>
      </div>

      {editing      && <ExtensionEditor extension={editing} onClose={() => setEditing(null)} onSave={() => setEditing(null)} />}
      {installing   && <McpInstallSheet onClose={() => setInstalling(false)} />}
      {viewingTools && <McpToolsSheet record={viewingTools} onClose={() => setViewingTools(null)} />}
      {editingMcp   && <McpEditSheet record={editingMcp} onClose={() => setEditingMcp(null)} />}
      {chooserOpen  && <RuntimeChooserSheet
        onClose={() => setChooserOpen(false)}
        onPick={(runtime) => {
          setChooserOpen(false);
          setEditing({ id: "new", name: "New extension", code: "", runtime });
        }}
      />}
    </div>
  );
}

/* ---------- MCP install sheet — wizard
   Matches apps/desktop/src/settings/McpInstallSheet.tsx — segmented headers,
   plain footnote for auth-status (no green panel), Connect / Waiting / Re-authorize
   button states. ---------- */
function McpInstallSheet({ onClose }) {
  const [transport, setTransport] = React.useState("stdio");
  const [authKind, setAuthKind]   = React.useState("none");
  const [pkg, setPkg]   = React.useState("");
  const [args, setArgs] = React.useState("");
  const [envs, setEnvs] = React.useState("");
  const [url, setUrl]   = React.useState("");
  const [probing, setProbing] = React.useState(false);
  const [probed, setProbed]   = React.useState(undefined); // undefined = not probed; null = no auth; { kind:'oauth', issuer } = oauth
  const [bearerSecret, setBearerSecret] = React.useState("");
  const [oauthEnvVar, setOauthEnvVar]   = React.useState("");
  const [oauthBusy, setOauthBusy]   = React.useState(false);
  const [oauthAuth, setOauthAuth]   = React.useState(null);
  const [error, setError]           = React.useState(null);
  const secretNames = ["GITHUB_TOKEN", "LINEAR_TOKEN", "OPENAI_API_KEY"];

  const probe = () => {
    const trimmed = url.trim();
    if (!trimmed || probing) return;
    setProbing(true);
    setError(null);
    setTimeout(() => {
      try {
        const origin = new URL(trimmed).origin;
        const next = { kind: "oauth", issuer: origin, scopes: ["read", "write"] };
        setProbed(next);
        setAuthKind("oauth");
        setOauthAuth(next);
      } catch {
        setError("Enter a valid URL (e.g. https://mcp.linear.app/sse).");
        setProbed(null);
      } finally {
        setProbing(false);
      }
    }, 600);
  };

  const connectOauth = () => {
    if (oauthBusy) return;
    const candidate = oauthAuth || probed;
    if (!candidate || candidate.kind !== "oauth") {
      setError("OAuth requires a probed server — paste an endpoint and click Probe first.");
      return;
    }
    setError(null);
    setOauthBusy(true);
    setTimeout(() => {
      setOauthAuth({ ...candidate, scopes: candidate.scopes || ["read", "write"] });
      setOauthBusy(false);
    }, 1400);
  };

  const installDisabled =
    (transport === "stdio" && !pkg.trim()) ||
    (transport === "http"  && !url.trim()) ||
    (authKind === "bearer" && !bearerSecret) ||
    (authKind === "oauth"  && !oauthAuth) ||
    (authKind === "oauth"  && transport === "stdio" && !oauthEnvVar.trim());

  const oauthButtonLabel = oauthBusy ? "Waiting for browser…" : (oauthAuth ? "Re-authorize" : "Connect");
  const oauthButtonDisabled = oauthBusy || (transport === "http" && !probed) || (transport === "stdio" && !oauthEnvVar.trim());

  return (
    <div className="settings-overlay" onMouseDown={onClose} onClick={e => e.stopPropagation()} style={{ zIndex: 50 }}>
      <div
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(560px, 94vw)", maxHeight: "86vh", overflowY: "auto",
          background: "var(--bg-card)", border: "1px solid var(--stroke-soft)",
          borderRadius: "var(--radius-xl)", padding: 18, boxShadow: "var(--elev-3)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        {/* Header */}
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <Icon name="package" size={16} color="var(--fg2)" />
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--fg1)" }}>Install MCP server</div>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={16} color="var(--fg2)" /></button>
        </div>

        {/* Transport */}
        <Segmented
          value={transport}
          onChange={(v) => {
            setTransport(v); setError(null); setProbed(undefined);
            setOauthAuth(null); setAuthKind("none");
          }}
          options={[
            { value: "stdio", label: "stdio (npm)" },
            { value: "http",  label: "Remote (HTTP)" },
          ]}
        />

        {/* Per-transport body */}
        {transport === "stdio" ? (
          <>
            <div className="field">
              <label className="field-label">npm package</label>
              <input
                className="field-input"
                placeholder="@modelcontextprotocol/server-filesystem"
                value={pkg}
                onChange={e => setPkg(e.target.value)}
                autoFocus
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div className="field">
              <label className="field-label">Args — one per line, optional</label>
              <textarea
                className="field-input"
                placeholder="/Users/me/Notes"
                value={args}
                onChange={e => setArgs(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", minHeight: 64 }}
              />
            </div>
            <div className="field">
              <label className="field-label">Env-secret names — one per line, optional</label>
              <textarea
                className="field-input"
                placeholder="GITHUB_TOKEN"
                value={envs}
                onChange={e => setEnvs(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", minHeight: 64 }}
              />
              <div className="footnote" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="lock" size={11} color="var(--fg3)" />
                Values come from <strong style={{ color: "var(--fg1)" }}>Settings → Secrets</strong>.
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <label className="field-label">Endpoint URL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="field-input"
                placeholder="https://mcp.linear.app/sse"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setProbed(undefined); setOauthAuth(null); }}
                autoFocus
                style={{ flex: 1, fontFamily: "var(--font-mono)" }}
              />
              <Button variant="secondary" size="md" onClick={probe} disabled={!url.trim() || probing}>
                {probing ? "Probing…" : "Probe"}
              </Button>
            </div>
            {probed === null && (
              <div className="footnote">Server is reachable without auth.</div>
            )}
            {probed && probed.kind === "oauth" && (
              <div className="footnote">
                Server requires OAuth · <span style={{ fontFamily: "var(--font-mono)" }}>{probed.issuer}</span>
              </div>
            )}
          </div>
        )}

        {/* Auth */}
        <div className="field">
          <label className="field-label">Authentication</label>
          <Segmented
            value={authKind}
            onChange={(v) => { setAuthKind(v); setError(null); }}
            options={[
              { value: "none",   label: "None" },
              { value: "bearer", label: "Bearer" },
              { value: "oauth",  label: "OAuth" },
            ]}
          />
        </div>

        {/* Bearer */}
        {authKind === "bearer" && (
          <div className="field">
            <label className="field-label">Bearer-token secret</label>
            <select
              className="field-input"
              value={bearerSecret}
              onChange={(e) => setBearerSecret(e.target.value)}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <option value="">— pick a secret —</option>
              {secretNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="footnote" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={11} color="var(--fg3)" />
              The token is read from <strong style={{ color: "var(--fg1)" }}>Settings → Secrets</strong> at call time.
            </div>
          </div>
        )}

        {/* OAuth */}
        {authKind === "oauth" && (
          <div className="field">
            {transport === "stdio" && (
              <>
                <label className="field-label">Env-var name for the OAuth token</label>
                <input
                  className="field-input"
                  placeholder="MY_SERVER_TOKEN"
                  value={oauthEnvVar}
                  onChange={(e) => setOauthEnvVar(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <div className="footnote">The access token is injected into the child process under this name.</div>
              </>
            )}
            {oauthAuth && oauthAuth.kind === "oauth" && (
              <div className="footnote">
                Authorized with <span style={{ fontFamily: "var(--font-mono)" }}>{oauthAuth.issuer}</span>
                {oauthAuth.scopes && oauthAuth.scopes.length > 0 ? <> · scopes: {oauthAuth.scopes.join(" ")}</> : null}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Button variant="secondary" size="md" onClick={connectOauth} disabled={oauthButtonDisabled}>
                {oauthButtonLabel}
              </Button>
            </div>
            {transport === "stdio" && (
              <div className="footnote">
                Stdio OAuth requires the package to read the token from the env var you chose. Probe + Connect from a server URL isn't supported for stdio — the issuer is the one upstream the npm package talks to.
              </div>
            )}
          </div>
        )}

        {/* Footer footnote */}
        <div className="footnote" style={{ lineHeight: 1.45 }}>
          {transport === "stdio"
            ? <>gen-app spawns the server with <code className="code">npx -y &lt;package&gt;</code>. An MCP server runs as your user — review the package before installing.</>
            : <>Remote MCP traffic is plain HTTPS; auth tokens go in the keychain.</>
          }
        </div>

        {error && <div style={{ fontSize: 11, color: "var(--color-red)" }}>{error}</div>}

        {/* Actions */}
        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={onClose} disabled={installDisabled}
            style={{ opacity: installDisabled ? 0.4 : 1, pointerEvents: installDisabled ? "none" : "auto" }}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- MCP tools sheet ----------
   Matches apps/desktop/src/settings/McpToolsSheet.tsx — header shows the
   npmPackage (not the synthetic id), schema is pretty-printed under each tool. */
const MCP_TOOLS_BY_EXT = {
  "mcp.modelcontextprotocol-server-filesystem": [
    { name: "read_file",      description: "Read the contents of a file from the allowed directory. Returns up to 5 MB.", input: { type: "object", properties: { path: { type: "string", description: "Absolute path inside the sandbox." } }, required: ["path"] } },
    { name: "write_file",     description: "Create or overwrite a file in the allowed directory.", input: { type: "object", properties: { path: { type: "string" }, content: { type: "string", description: "UTF-8 contents." } }, required: ["path", "content"] } },
    { name: "list_directory", description: "List immediate children of a directory.", input: { type: "object", properties: { path: { type: "string" }, recursive: { type: "boolean", default: false } }, required: ["path"] } },
  ],
  "mcp.linear-app": [
    { name: "create_issue",     description: "Create a new Linear issue.", input: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, team: { type: "string" } }, required: ["title", "team"] } },
    { name: "search_issues",    description: "Search issues by query.",     input: { type: "object", properties: { q: { type: "string" }, limit: { type: "number", default: 20 } }, required: ["q"] } },
    { name: "comment_on_issue", description: "Add a comment to an issue.",  input: { type: "object", properties: { id: { type: "string" }, body: { type: "string" } }, required: ["id", "body"] } },
  ],
};

function McpToolsSheet({ record, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tools = MCP_TOOLS_BY_EXT[record.id] || [];

  return (
    <div className="settings-overlay" onMouseDown={onClose} onClick={e => e.stopPropagation()} style={{ zIndex: 50 }}>
      <div
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(640px, 94vw)", height: "min(620px, 90vh)",
          background: "var(--bg-window)", border: "1px solid var(--stroke-soft)",
          borderRadius: "var(--radius-xl)", boxShadow: "var(--elev-3)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: "1px solid var(--stroke-hairline)", padding: "12px 14px",
        }}>
          <Icon name="package" size={16} color="var(--fg2)" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>{record.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)" }}>
              {record.npmPackage} · {tools.length} tools
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose} title="Close (esc)"><Icon name="x" size={14} color="var(--fg2)" /></button>
        </div>

        {/* Tools list */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          background: "var(--bg-base)", padding: 12,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {tools.length === 0 ? (
            <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 12, color: "var(--fg3)" }}>This server reports no tools.</div>
          ) : tools.map(tool => (
            <div key={tool.name} style={{
              borderRadius: "var(--radius-md)", border: "1px solid var(--stroke-soft)",
              background: "var(--bg-card)", padding: 12,
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>{tool.name}</div>
              {tool.description && (
                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: "var(--fg2)" }}>{tool.description}</div>
              )}
              <pre style={{
                marginTop: 8, overflow: "auto",
                borderRadius: "var(--radius-sm)", background: "var(--bg-base)", padding: 8,
                fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.5, color: "var(--fg2)",
              }}><code>{JSON.stringify(tool.input, null, 2)}</code></pre>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          borderTop: "1px solid var(--stroke-hairline)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 11, color: "var(--fg3)", lineHeight: 1.4, flex: 1 }}>
            Tools become harness providers — call from a glue widget with{" "}
            <code className="code">ctx.useQuery('{record.id}', '&lt;tool&gt;', args)</code>.
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- MCP edit sheet ----------
   Matches apps/desktop/src/settings/McpEditSheet.tsx — stdio shows Args +
   Env-secret-names; http shows Endpoint URL. Auth changes need uninstall +
   reinstall, so they're out of scope here. */
function McpEditSheet({ record, onClose }) {
  const stdio = record.kind !== "http";
  const [args, setArgs]       = React.useState(record.args ? record.args.join("\n") : "");
  const [envs, setEnvs]       = React.useState(record.envSecrets ? record.envSecrets.join("\n") : "");
  const [endpoint, setEndpoint] = React.useState(record.endpoint || record.npmPackage || "");

  return (
    <div className="settings-overlay" onMouseDown={onClose} onClick={e => e.stopPropagation()} style={{ zIndex: 50 }}>
      <div
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(560px, 94vw)",
          background: "var(--bg-card)", border: "1px solid var(--stroke-soft)",
          borderRadius: "var(--radius-xl)", padding: 18, boxShadow: "var(--elev-3)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <div className="row" style={{ alignItems: "center", gap: 8 }}>
          <Icon name="settings" size={16} color="var(--fg2)" />
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--fg1)" }}>Edit MCP server</div>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={16} color="var(--fg2)" /></button>
        </div>

        <div className="footnote">
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg1)" }}>{record.id}</span>{" "}
          · {stdio ? "stdio" : "http"} · {record.tools} tools
        </div>

        {stdio ? (
          <>
            <div className="field">
              <label className="field-label">Args — one per line</label>
              <textarea
                className="field-input"
                value={args}
                onChange={e => setArgs(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", minHeight: 96 }}
                autoFocus
              />
              <div className="footnote">
                These are passed to <code className="code">npx -y {record.npmPackage}</code>.
              </div>
            </div>
            <div className="field">
              <label className="field-label">Env-secret names — one per line, optional</label>
              <textarea
                className="field-input"
                value={envs}
                onChange={e => setEnvs(e.target.value)}
                placeholder="GITHUB_TOKEN"
                style={{ fontFamily: "var(--font-mono)", minHeight: 64 }}
              />
              <div className="footnote" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="lock" size={11} color="var(--fg3)" />
                Values come from <strong style={{ color: "var(--fg1)" }}>Settings → Secrets</strong>.
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <label className="field-label">Endpoint URL</label>
            <input
              className="field-input"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              style={{ fontFamily: "var(--font-mono)" }}
              autoFocus
            />
            <div className="footnote">
              To change auth (bearer / OAuth), uninstall and reinstall this server.
            </div>
          </div>
        )}

        <div className="footnote" style={{ lineHeight: 1.45 }}>
          Saving drops the cached connection. The next call respawns{stdio ? " the child" : " the connection"} with the new config.
        </div>

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={onClose}>Save</Button>
        </div>
      </div>
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

/* ---------- Runtime chooser sheet ----------
   Matches apps/desktop/src/settings/RuntimeChooserSheet.tsx — two big rows,
   pick a runtime, then route into ExtensionEditor with the picked runtime's
   starter templates. Identity / network / permissions live in the editor. */
function RuntimeChooserSheet({ onClose, onPick }) {
  const row = ({ runtime, icon, iconColor, title, body }) => (
    <button
      type="button"
      onClick={() => onPick(runtime)}
      className="list-row"
      style={{ alignItems: "flex-start", padding: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
    >
      <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
        <Icon name={icon} size={14} color={iconColor} />
      </div>
      <div className="row-body" style={{ minWidth: 0 }}>
        <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{title}</span>
          <RuntimeChip runtime={runtime} />
        </div>
        <div className="row-sub" style={{ whiteSpace: "normal", lineHeight: 1.5 }}>{body}</div>
      </div>
      <Icon name="chevron-right" size={16} color="var(--fg3)" />
    </button>
  );

  return (
    <div className="settings-overlay" onClick={onClose} style={{ zIndex: 50 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(540px, 94vw)",
          background: "var(--bg-card)", border: "1px solid var(--stroke-soft)",
          borderRadius: "var(--radius-xl)", padding: 18, boxShadow: "var(--elev-3)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <div className="row" style={{ alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--fg1)" }}>New extension</div>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={14} color="var(--fg2)" /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.55, margin: 0 }}>
          Both runtimes live as folders on disk under{" "}
          <code className="code">~/Library/.../extensions/&lt;id&gt;/</code>. Pick the runtime that fits — you can&apos;t swap later without re-creating.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {row({
            runtime: "worker",
            icon: "puzzle",
            iconColor: "var(--color-purple)",
            title: "Worker",
            body: <>ESM authored across one or more <code className="code">.js</code> files, bundled into the sandbox worker at install time via esbuild. Capability-gated <code className="code">ctx.fetch</code>, <code className="code">ctx.secrets</code>, <code className="code">ctx.storage</code>. Works on iOS and desktop.</>,
          })}
          {row({
            runtime: "deno",
            icon: "globe",
            iconColor: "var(--color-cyan)",
            title: "Deno",
            body: <>TypeScript-native, long-lived <code className="code">deno run</code> subprocess with sandbox flags. Real Node-compat (<code className="code">npm:</code> imports, <code className="code">node:sqlite</code>, PGlite, Redka). Outbound network gated by a per-extension HTTP proxy. Desktop only.</>,
          })}
        </div>

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- About panel ----------
   App version + runtime versions + data folders + open-source licenses.
   Reuses existing kit atoms: RuntimeChip, kv rows, the Export .zip CTA style. */
const ABOUT_LICENSES = [
  { name: "Deno",         license: "MIT",              repo: "denoland/deno",        runtime: "deno" },
  { name: "Tauri",        license: "MIT / Apache-2.0", repo: "tauri-apps/tauri",     runtime: null   },
  { name: "React",        license: "MIT",              repo: "facebook/react",       runtime: null   },
  { name: "llama.cpp",    license: "MIT",              repo: "ggerganov/llama.cpp",  runtime: null   },
  { name: "Lucide icons", license: "ISC",              repo: "lucide-icons/lucide",  runtime: null   },
  { name: "Konsta UI",    license: "MIT",              repo: "konstaui/konsta",      runtime: null   },
  { name: "SQLite",       license: "Public domain",    repo: "sqlite.org",           runtime: null   },
  { name: "Diesel",       license: "MIT / Apache-2.0", repo: "diesel-rs/diesel",     runtime: null   },
];

function AboutPanel() {
  const kvRow = (k, v, mono = true) => (
    <div className="list-row" style={{ cursor: "default" }}>
      <div className="row-body" style={{ flex: 1 }}>
        <div className="row-title" style={{ fontSize: 13 }}>{k}</div>
      </div>
      <div style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontSize: 12, color: "var(--fg1)" }}>{v}</div>
    </div>
  );

  return (
    <div className="settings-panel">

      {/* App identity */}
      <div className="settings-section">
        <div className="settings-section-label">gen-app</div>
        <div className="footnote" style={{ marginTop: 2, marginBottom: 8 }}>
          A chat that builds widgets. Built on Tauri.
        </div>
        <div className="list">
          {kvRow("Version", "0.6.3 (build 1842)")}
          {kvRow("Channel", "beta", false)}
          {kvRow("Updates",
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-green)" }}></span>
              Up to date · checked 12m ago
            </span>,
            false)}
          <div className="list-row" style={{ cursor: "default" }}>
            <div className="row-body" style={{ flex: 1 }}>
              <div className="row-title" style={{ fontSize: 13 }}>Release notes</div>
            </div>
            <a style={{ fontSize: 12, color: "var(--color-accent)", cursor: "pointer" }}>CHANGELOG.md</a>
          </div>
        </div>
      </div>

      {/* Runtime */}
      <div className="settings-section">
        <div className="settings-section-label">Runtime</div>
        <div className="list">
          <div className="list-row" style={{ cursor: "default" }}>
            <div className="row-body" style={{ flex: 1 }}>
              <div className="row-title" style={{ fontSize: 13 }}>Deno sandbox</div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <RuntimeChip runtime="deno" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)" }}>v2.1.4 · aarch64-apple-darwin</span>
            </div>
          </div>
          {kvRow("Tauri",      "v2.1.0")}
          {kvRow("llama.cpp",  "b3892 · built-in")}
          {kvRow("Claude CLI", "0.9.2 · ~/.local/bin/claude")}
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <div className="settings-section-label">Data</div>
        <div className="list">
          <div className="list-row" style={{ cursor: "default" }}>
            <div className="row-body" style={{ flex: 1 }}>
              <div className="row-title" style={{ fontSize: 13 }}>App data</div>
              <div className="row-sub" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>~/Library/Application Support/com.genapp.desktop</div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)" }}>38 MB</span>
              <button className="btn btn-icon" title="Open in Finder"><Icon name="folder-open" size={14} color="var(--fg2)" /></button>
            </div>
          </div>
          <div className="list-row" style={{ cursor: "default" }}>
            <div className="row-body" style={{ flex: 1 }}>
              <div className="row-title" style={{ fontSize: 13 }}>Extensions cache</div>
              <div className="row-sub" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>extensions/ · 3 deno · 1 worker</div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg2)" }}>216 MB</span>
              <button className="btn btn-icon" title="Open in Finder"><Icon name="folder-open" size={14} color="var(--fg2)" /></button>
            </div>
          </div>
          <div className="list-row" style={{ cursor: "default" }}>
            <div className="row-body" style={{ flex: 1 }}>
              <div className="row-title" style={{ fontSize: 13 }}>Logs</div>
              <div className="row-sub" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>gen-app-logs.db · 14,820 events</div>
            </div>
            <Button variant="secondary" size="sm" icon="download">Export .zip</Button>
          </div>
        </div>
      </div>

      {/* Open-source licenses */}
      <div className="settings-section">
        <div className="settings-section-label">Open-source licenses</div>
        <div className="list">
          {ABOUT_LICENSES.map(lic => (
            <div key={lic.name} className="list-row" style={{ cursor: "default" }}>
              <div className="row-body" style={{ flex: 1, minWidth: 0 }}>
                <div className="row-title" style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>{lic.name}</span>
                  {lic.runtime === "deno" && <RuntimeChip runtime="deno" />}
                </div>
                <div className="row-sub" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{lic.repo}</div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg2)",
                  padding: "2px 6px", borderRadius: 4, background: "var(--bg-card-elevated)",
                }}>{lic.license}</span>
                <button className="btn btn-icon" title="View license"><Icon name="external-link" size={12} color="var(--fg2)" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="footnote" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span>Showing 8 of 184 dependencies</span>
          <a style={{ color: "var(--color-accent)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="file-text" size={11} color="var(--color-accent)" />
            Full notice (THIRD_PARTY_NOTICES.md)
          </a>
        </div>
      </div>

      {/* Footer actions */}
      <div className="settings-section">
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <Button variant="secondary" size="sm" icon="rotate-cw">Check for updates</Button>
          <Button variant="secondary" size="sm">Copy diagnostics</Button>
          <span style={{ flex: 1 }}></span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg3)" }}>© 2026 · MIT</span>
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
  { id: "extensions", name: "Extensions", iosName: "Powers",  icon: "puzzle",    bg: "var(--color-purple)",   sub: `${BUNDLED_EXTS.length + USER_EXTS.length + MCP_EXTS.length} installed · ${MCP_EXTS.length} MCP`,  Panel: ExtensionsPanel },
  { id: "secrets",    name: "Secrets",    iosName: "Vault",   icon: "key",       bg: "var(--color-yellow)",   sub: "4 in keychain",        Panel: SecretsPanel },
  { id: "logs",       name: "Logs",       iosName: "Diaries", icon: "file-text", bg: "var(--fg2)",            sub: "Live · 8 events",    Panel: LogsPanel },
  { id: "about",      name: "About",      iosName: "About",   icon: "info",      bg: "var(--color-indigo)",   sub: "v0.7.0 · deno v2.1.4", Panel: AboutPanel },
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
            <span className="brand-display" style={{ fontSize: 16 }}>gen·app</span> · v0.7.0
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

Object.assign(window, { DesktopSettings, IOSSettings, SECTIONS, PROVIDERS_LIST, BUNDLED_EXTS, USER_EXTS, MCP_EXTS, LOGS_SEED, RuntimeChip, StatusDot });
