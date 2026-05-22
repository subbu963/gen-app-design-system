/* Secrets manager + Extension editor — slotted into Settings.
   Mirrors the preview cards (preview/secrets-manager.html, preview/extension-editor.html).
   ExtensionEditor uses CodeMirror 5 from CDN; we lazy-mount it on the textarea. */

// ── Seed data ────────────────────────────────────────────────────────────────
const SECRETS_SEED = [
  { name: "OPENAI_API_KEY",      scope: "global",    masked: "sk-proj-••••••a9b2", usedBy: "gen-app · chat",   icon: "key",  iconColor: "var(--color-yellow)", active: false },
  { name: "GROQ_API_KEY",        scope: "global",    masked: "gsk_••••••12c4",      usedBy: "gen-app · chat",   icon: "key",  iconColor: "var(--color-yellow)", active: true  },
  { name: "YAHOO_FINANCE_TOKEN", scope: "extension", masked: "••••••••3f8e",        usedBy: "@yahoo",           icon: "key",  iconColor: "var(--color-purple)", active: false },
  { name: "UNIT",                scope: "constant",  masked: '"fahrenheit"',        usedBy: "@open-meteo",      icon: "hash", iconColor: "var(--fg2)",          active: false },
];

const EXT_SEED_CODE = `// Open-Meteo extension — feeds the @weather widget
// gen-app passes \`ctx\` with \`secrets\`, \`widgets\`, \`fetch\`, \`emit\`.
export const manifest = {
  id: "open-meteo",
  name: "Open-Meteo",
  version: "1.2.0",
  refresh: 60, // seconds
};

export async function run(ctx) {
  const lat = ctx.widget?.props?.lat ?? 40.6782;
  const lon = ctx.widget?.props?.lon ?? -73.9442;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", ctx.secrets.UNIT ?? "fahrenheit");

  const res = await ctx.fetch(url);
  if (!res.ok) return ctx.emit({ status: "error", message: \`HTTP \${res.status}\` });

  const data = await res.json();
  ctx.emit({
    status: "live",
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  });
}`;

// ── Scope pill helper ────────────────────────────────────────────────────────
function ScopePill({ scope, active }) {
  if (scope === "global") {
    return (
      <div className="row" style={{ gap: 6 }}>
        <span className="symbol-chip" style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)", borderColor: "transparent" }}>global</span>
        {active && (
          <span className="symbol-chip" style={{ background: "var(--tint-green)", color: "var(--color-green)", borderColor: "transparent" }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--color-green)", marginRight: 4 }}></span>active
          </span>
        )}
      </div>
    );
  }
  if (scope === "extension") return <span className="symbol-chip" style={{ background: "var(--tint-purple)", color: "var(--color-purple)", borderColor: "transparent" }}>extension</span>;
  return <span className="symbol-chip" style={{ background: "var(--bg-card-elevated)", color: "var(--fg2)", borderColor: "var(--stroke-soft)" }}>constant</span>;
}

// ── Add-secret sheet ─────────────────────────────────────────────────────────
function AddSecretSheet({ onClose, onSave }) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [scope, setScope] = React.useState("global");
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="bg-card rounded-xl p-4 flex flex-col gap-3 border border-soft"
           onClick={e => e.stopPropagation()}
           style={{ boxShadow: "var(--elev-3)", maxWidth: 480, width: "100%" }}>
        <div className="flex items-center justify-between">
          <div className="font-serif italic text-xl text-fg1 leading-none">Add a secret.</div>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={16} color="var(--fg2)" /></button>
        </div>
        <div className="text-xs text-fg2 leading-snug">Stored in your OS keychain. We never see it.</div>
        <div className="field">
          <label className="field-label">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
            placeholder="ANTHROPIC_API_KEY"
            className="field-input"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
          />
        </div>
        <div className="field">
          <label className="field-label">Value</label>
          <div className="row" style={{ background: "var(--bg-input)", border: "1px solid var(--stroke-soft)", borderRadius: 8, padding: "10px 14px", gap: 4 }}>
            <input
              type={reveal ? "text" : "password"}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="sk-ant-api03-…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--fg1)", fontSize: 14, fontFamily: "var(--font-mono)" }}
            />
            <button className="btn btn-icon" onClick={() => setReveal(r => !r)}>
              <Icon name={reveal ? "eye-off" : "eye"} size={14} color="var(--fg2)" />
            </button>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Scope</label>
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "global",    label: "Global · any extension" },
              { value: "extension", label: "Bound to one extension" },
            ]}
          />
        </div>
        <div className="row" style={{ marginTop: 4 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <div className="spacer"></div>
          <Button variant="primary" icon="lock" disabled={!name || !value}
                  onClick={() => { onSave({ name, value, scope }); onClose(); }}>
            Save to keychain
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Secrets panel (used inside the Settings sheet) ───────────────────────────
function SecretsPanel() {
  const [secrets, setSecrets] = React.useState(SECRETS_SEED);
  const [adding, setAdding] = React.useState(false);

  const remove = (name) => setSecrets(prev => prev.filter(s => s.name !== name));
  const add = (s) => setSecrets(prev => [...prev, { ...s, masked: "••••••••" + s.value.slice(-4), usedBy: "—", icon: "key", iconColor: "var(--color-yellow)" }]);

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Keychain · {secrets.length} {secrets.length === 1 ? "secret" : "secrets"}</span>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setAdding(true)}>Add secret</Button>
        </div>
        <div className="list">
          {secrets.map(s => (
            <div key={s.name} className="list-row">
              <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
                <Icon name={s.icon} size={14} color={s.iconColor} />
              </div>
              <div className="row-body">
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg1)" }}>{s.name}</span>
                  <ScopePill scope={s.scope} active={s.active} />
                </div>
                <div className="row-sub" style={{ fontFamily: "var(--font-mono)" }}>
                  {s.masked} <span style={{ color: "var(--fg4)" }}>·</span> <span style={{ color: "var(--fg2)" }}>used by</span> <span style={{ color: "var(--fg1)" }}>{s.usedBy}</span>
                </div>
              </div>
              <div className="row" style={{ gap: 2 }}>
                <button className="btn btn-icon"><Icon name="eye" size={14} color="var(--fg2)" /></button>
                <button className="btn btn-icon"><Icon name="copy" size={14} color="var(--fg2)" /></button>
                <button className="btn btn-icon" onClick={() => remove(s.name)}>
                  <Icon name="trash-2" size={14} color="var(--color-red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="footnote" style={{ marginTop: 8 }}>
          Secrets are bound to this device. Extensions can only read names listed in their <code className="code">manifest.permissions.secrets</code>.
        </div>
      </div>
      {adding && <AddSecretSheet onClose={() => setAdding(false)} onSave={add} />}
    </div>
  );
}

// ── Extension editor (used inside the Settings sheet) ────────────────────────
function ExtensionEditor({ extension, onClose, onSave }) {
  const taRef = React.useRef(null);
  const [code, setCode] = React.useState(extension?.code || EXT_SEED_CODE);
  const [name, setName] = React.useState(extension?.name || "Open-Meteo");

  // Lazy-load CodeMirror from CDN (idempotent — only adds the tags once)
  const [cmReady, setCmReady] = React.useState(!!window.CodeMirror);
  React.useEffect(() => {
    if (cmReady) return;
    const css = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css";
    const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js",
    ];
    if (!document.querySelector(`link[href="${css}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = css; document.head.appendChild(l);
    }
    let pending = scripts.length;
    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { if (--pending === 0) setCmReady(true); return; }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => { if (--pending === 0) setCmReady(true); };
      document.head.appendChild(s);
    });
  }, [cmReady]);

  React.useEffect(() => {
    if (!cmReady || !taRef.current || taRef.current.dataset.cmMounted) return;
    const cm = window.CodeMirror.fromTextArea(taRef.current, {
      mode: "javascript", lineNumbers: true,
      autoCloseBrackets: true, matchBrackets: true,
      indentUnit: 2, tabSize: 2, smartIndent: true, viewportMargin: Infinity,
    });
    taRef.current.dataset.cmMounted = "1";
    cm.on("change", c => setCode(c.getValue()));
  }, [cmReady]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="bg-window rounded-xl flex flex-col"
           onClick={e => e.stopPropagation()}
           style={{ width: 980, height: "min(680px, 90vh)", maxWidth: "100%", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--stroke-hairline)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-card-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="puzzle" size={18} color="var(--fg2)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={name} onChange={e => setName(e.target.value)}
                   style={{ background: "transparent", border: "none", outline: "none", color: "var(--fg1)", fontSize: 16, fontWeight: 600, letterSpacing: "-0.012em" }} />
            <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{name.toLowerCase().replace(/\s+/g, "-")}.js · {code.split("\n").length} lines</div>
          </div>
          <Button variant="clear" size="sm" icon="play">Test</Button>
          <Button variant="primary" size="sm" icon="check" onClick={() => onSave?.({ name, code })}>Save</Button>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={16} color="var(--fg2)" /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: 12 }}>
          <textarea ref={taRef} defaultValue={EXT_SEED_CODE}
                    style={{ width: "100%", height: "100%", background: "var(--bg-base)", color: "var(--fg1)", border: "1px solid var(--stroke-soft)", borderRadius: 10, padding: 12, fontFamily: "var(--font-mono)", fontSize: 13, outline: "none", resize: "none" }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SecretsPanel, ExtensionEditor, AddSecretSheet, SECRETS_SEED });
