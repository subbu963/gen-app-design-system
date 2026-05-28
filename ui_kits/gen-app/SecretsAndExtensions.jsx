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

// Seed file trees — one per runtime. Each is a `{ [path]: content }` map.
const SEED_TREE_DENO = {
  "manifest.json":
`{
  "id": "open-meteo",
  "name": "Open-Meteo",
  "version": "2.1.0",
  "description": "Current conditions + hourly outlook for a city.",
  "runtime": "deno",
  "entry": "index.ts",
  "ports": [{ "name": "http", "protocol": "http" }],
  "capabilities": ["network"],
  "permissions": {
    "network": ["geocoding-api.open-meteo.com", "api.open-meteo.com"],
    "secrets": []
  },
  "lifecycle": { "idleStopMs": 300000 },
  "providers": [
    { "name": "getForecast",
      "description": "Current + hourly for a city.",
      "input": { "type": "object",
                 "properties": { "city": { "type": "string" } },
                 "required": ["city"] } }
  ],
  "widgets": []
}
`,
  "index.ts":
`// Open-Meteo — deno-runtime entry.
import { startExtension } from "@gen-app/extension-sdk/runtime";

await startExtension(async (ctx) => {
  Deno.serve(
    { port: ctx.port, hostname: "127.0.0.1", signal: ctx.signal },
    async (req) => {
      const url = new URL(req.url);
      if (req.method === "POST" && url.pathname === "/getForecast") {
        const { city } = await req.json() as { city: string };
        const geo = await fetch(
          \`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(city)}&count=1\`,
        );
        const { results } = await geo.json();
        if (!results?.length) {
          return Response.json({ error: \`couldn't find '\${city}'\` }, { status: 404 });
        }
        const { latitude, longitude, name, country } = results[0];
        const forecast = await fetch(
          \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current=temperature_2m,weather_code\`,
        );
        const data = await forecast.json();
        ctx.log("info", "served forecast", { city: name });
        return Response.json({
          place: \`\${name}, \${country}\`,
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      }
      return new Response("not found", { status: 404 });
    },
  );
});
`,
  "deno.json":
`{
  "imports": {
    "@gen-app/extension-sdk/runtime": "npm:@gen-app/extension-sdk/runtime"
  }
}
`,
};

const SEED_TREE_WORKER = {
  "manifest.json":
`{
  "id": "hacker-news",
  "name": "Hacker News",
  "version": "0.1.0",
  "description": "Top stories from HN's Algolia search.",
  "runtime": "worker",
  "capabilities": ["network"],
  "permissions": { "network": ["hn.algolia.com"], "secrets": [] },
  "providers": [
    { "name": "top", "description": "Top N front-page posts.",
      "input": { "type": "object",
                 "properties": { "limit": { "type": "number", "default": 5 } } } }
  ],
  "widgets": []
}
`,
  "src/index.js":
`// Worker-runtime provider — one of many .js files in this folder;
// esbuild bundles them into a single ESM module at install time.
import { topHits } from "./lib/hn.js";

export const top = async ({ limit = 5 }, ctx) => {
  const hits = await topHits(ctx, limit);
  return hits.map(h => ({ id: h.objectID, title: h.title, url: h.url, points: h.points }));
};
`,
  "src/lib/hn.js":
`export async function topHits(ctx, limit) {
  const res = await ctx.fetch("https://hn.algolia.com/api/v1/search?tags=front_page");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return JSON.parse(res.body).hits.slice(0, limit);
}
`,
};

function seedTreeFor(runtime) {
  return runtime === "deno" ? SEED_TREE_DENO : SEED_TREE_WORKER;
}

// Convert a flat path → content map into react-arborist's nested tree.
// Directories come first, then files; both alphabetical.
function pathsToTree(paths) {
  const root = { children: [] };
  for (const p of paths) {
    const parts = p.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const id = parts.slice(0, i + 1).join("/");
      const isLeaf = i === parts.length - 1;
      let child = node.children?.find(c => c.name === parts[i]);
      if (!child) {
        child = isLeaf ? { id, name: parts[i] } : { id, name: parts[i], children: [] };
        (node.children ??= []).push(child);
      }
      node = child;
    }
  }
  (function sortRec(n) {
    if (!n.children) return;
    n.children.sort((a, b) => {
      const aDir = !!a.children, bDir = !!b.children;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortRec);
  })(root);
  return root.children;
}

function fileIconFor(filename) {
  if (filename.endsWith("/")) return { name: "folder", color: "var(--color-yellow)" };
  if (filename === "manifest.json") return { name: "file-text", color: "var(--color-accent)" };
  if (filename === "deno.json")     return { name: "file-text", color: "var(--color-green)" };
  if (/\.tsx?$/.test(filename))     return { name: "file-code", color: "var(--color-cyan)" };
  if (/\.jsx?$/.test(filename))     return { name: "file-code", color: "var(--color-purple)" };
  if (/\.json$/.test(filename))     return { name: "file-text", color: "var(--fg2)" };
  return { name: "file", color: "var(--fg2)" };
}

function langFor(filename) {
  const rc = window.ReactCodeMirror;
  if (!rc) return [];
  if (filename.endsWith(".json")) return [rc.json()];
  return [rc.javascript({ typescript: filename.endsWith(".ts") || filename.endsWith(".tsx"), jsx: filename.endsWith(".jsx") || filename.endsWith(".tsx") })];
}

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

// ── Ask AI panel (right column inside the ExtensionEditor) ─────────────────
function AskAIPanel({ files, active, onClose, onOpenFile }) {
  const SlashHint = ({ children }) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "1px 6px", borderRadius: 4,
      fontFamily: "var(--font-mono)", fontSize: 9.5,
      background: "var(--bg-card-elevated)", color: "var(--fg3)",
      border: "1px solid var(--stroke-soft)",
    }}>{children}</span>
  );

  const FileChip = ({ name, dot, color }) => (
    <button onClick={() => onOpenFile?.(name)} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "1px 6px", borderRadius: 4, cursor: "pointer",
      background: "var(--bg-card-elevated)", color: "var(--fg2)",
      border: "1px solid var(--stroke-soft)",
      fontFamily: "var(--font-mono)", fontSize: 10,
    }}>
      <Icon name="file-code" size={10} color={color} />
      {name}
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--color-green)", boxShadow: "0 0 0 0 rgba(48,209,88,0.45)", animation: "pulse 2s ease-out infinite" }}></span>}
    </button>
  );

  const Bubble = ({ author, who, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: who === "agent" ? "var(--color-accent)" : "var(--fg3)" }}>{author}</div>
      <div style={{ fontSize: 11.5, color: "var(--fg1)", lineHeight: 1.55 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-card)", borderLeft: "1px solid var(--stroke-soft)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--stroke-hairline)", minWidth: 0 }}>
        <Icon name="sparkles" size={13} color="var(--color-accent)" />
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg1)", whiteSpace: "nowrap" }}>Ask AI</div>
        <span style={{ flex: 1, minWidth: 0 }}></span>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "2px 6px", borderRadius: 4, cursor: "pointer",
          fontFamily: "var(--font-mono)", fontSize: 10, whiteSpace: "nowrap",
          background: "var(--bg-card-elevated)", color: "var(--fg2)",
          border: "1px solid var(--stroke-soft)",
        }}>sonnet <Icon name="chevron-down" size={10} color="var(--fg3)" /></button>
        <button className="btn btn-icon" onClick={onClose} title="Collapse"><Icon name="panel-right-close" size={13} color="var(--fg2)" /></button>
      </div>

      {/* Scope strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", padding: "6px 12px", background: "var(--bg-card-elevated)", borderBottom: "1px solid var(--stroke-hairline)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>scope:</span>
        {Object.keys(files).slice(0, 4).map(f => (
          <FileChip key={f} name={f.split("/").pop()} dot={f === active} color={fileIconFor(f).color} />
        ))}
        <button style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", padding: "1px 6px", borderRadius: 4, background: "transparent", border: "none", cursor: "pointer" }}>+ context</button>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 14, background: "var(--bg-window)" }}>
        <Bubble who="user" author="you">
          add a <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "0 4px", borderRadius: 3, background: "var(--bg-card-elevated)" }}>getHourly</code> provider that takes <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "0 4px", borderRadius: 3, background: "var(--bg-card-elevated)" }}>{`{ city, hours }`}</code> and returns a list of temperatures
        </Bubble>

        <Bubble who="agent" author="agent">
          Adding a route + provider entry in the manifest. Geocoding stays in <code style={{ fontFamily: "var(--font-mono)" }}>geocode()</code>; I'll factor out the open-meteo call too.
        </Bubble>

        {/* Tool-call status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg3)" }}>
          <Icon name="wrench" size={11} color="var(--fg3)" />
          propose_change · <span style={{ color: "var(--fg1)" }}>index.ts</span> · +5 lines
          <span style={{ flex: 1 }}></span>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--color-green)", boxShadow: "0 0 0 0 rgba(48,209,88,0.45)", animation: "pulse 2s ease-out infinite" }}></span>
          <span style={{ color: "var(--color-green)" }}>writing</span>
        </div>

        {/* Diff card */}
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--stroke-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--bg-card-elevated)" }}>
            <Icon name="file-code" size={11} color="var(--color-cyan)" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg1)", flex: 1 }}>index.ts</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--color-green)" }}>+5</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.55, background: "var(--bg-window)" }}>
            {[
              ["15", `      }`, null],
              ["+", `      if (url.pathname === "/getHourly") {`, "add"],
              ["+", `        const { city, hours = 12 } = await req.json();`, "add"],
              ["+", `        const place = await geocode(city);`, "add"],
              ["+", `        const hourly = await fetchHourly(place, hours);`, "add"],
              ["+", `        return Response.json(hourly);`, "add"],
            ].map(([g, txt, kind], i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "14px 1fr", gap: 6, padding: "1px 8px",
                background: kind === "add" ? "rgba(48,209,88,0.08)" : "transparent",
                color: kind === "add" ? "var(--color-green)" : "var(--fg2)",
              }}>
                <span style={{ color: kind === "add" ? "var(--color-green)" : "var(--fg4)" }}>{g}</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderTop: "1px solid var(--stroke-hairline)", background: "var(--bg-card)" }}>
            <button style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
              color: "var(--fg2)", background: "transparent", border: "1px solid var(--stroke-soft)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}><Icon name="eye" size={10} color="var(--fg2)" />Preview</button>
            <span style={{ flex: 1 }}></span>
            <button style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: "var(--fg3)", background: "transparent", border: "none", cursor: "pointer" }}>Reject</button>
            <button style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, color: "white", background: "var(--color-accent)", border: "none", cursor: "pointer" }}>Apply</button>
          </div>
        </div>

        <Bubble who="agent" author="agent">
          Also adding the provider entry to <code style={{ fontFamily: "var(--font-mono)" }}>manifest.json</code>.
          <div style={{ marginTop: 6, fontSize: 10.5, color: "var(--fg3)" }}>
            Next: <span style={{ color: "var(--fg2)" }}>manifest.json</span> · then <span style={{ color: "var(--fg2)" }}>lib/open-meteo.ts</span>
          </div>
        </Bubble>
      </div>

      {/* Slash hints */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", padding: "6px 12px", borderTop: "1px solid var(--stroke-hairline)" }}>
        <SlashHint>/explain</SlashHint>
        <SlashHint>/refactor</SlashHint>
        <SlashHint>/test</SlashHint>
        <SlashHint>/add-provider</SlashHint>
        <SlashHint>/preview</SlashHint>
      </div>

      {/* Composer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid var(--stroke-hairline)", background: "var(--bg-card)" }}>
        <Icon name="at-sign" size={13} color="var(--fg3)" />
        <input placeholder="Ask, paste, or hit / for commands…"
               style={{ flex: 1, background: "transparent", color: "var(--fg1)", fontSize: 11.5, border: "none", outline: "none" }} />
        <button style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
          color: "var(--fg2)", background: "transparent", border: "1px solid var(--stroke-soft)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}><Icon name="square" size={10} color="var(--color-orange)" />Stop</button>
        <button style={{
          width: 24, height: 24, borderRadius: 999, background: "var(--color-accent)",
          color: "white", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}><Icon name="arrow-up" size={12} color="white" /></button>
      </div>
    </div>
  );
}

function CollapsedAIRail({ onOpen, unread = 1 }) {
  return (
    <div style={{
      width: 40, flexShrink: 0, display: "flex", flexDirection: "column",
      alignItems: "center", gap: 12, padding: "10px 0",
      background: "var(--bg-card)", borderLeft: "1px solid var(--stroke-hairline)",
    }}>
      <button onClick={onOpen} title="Open Ask AI" style={{
        width: 26, height: 26, borderRadius: 8,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--color-accent-tint)", border: "none", cursor: "pointer",
      }}><Icon name="sparkles" size={13} color="var(--color-accent)" /></button>
      <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>Ask AI</div>
      <span style={{ flex: 1 }}></span>
      {unread > 0 && (
        <div style={{ position: "relative" }}>
          <button title={`${unread} pending change`} style={{
            width: 26, height: 26, borderRadius: 999,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-card-elevated)", border: "none", cursor: "pointer",
          }}><Icon name="git-pull-request" size={12} color="var(--color-orange)" /></button>
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 14, height: 14, borderRadius: 999,
            background: "var(--color-orange)", color: "white",
            fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        </div>
      )}
    </div>
  );
}

// ── Extension editor (used inside the Settings sheet) ──────────────────────
//
// Folder-aware. Uses react-arborist for the tree + @uiw/react-codemirror
// for the editor. Layout follows Variant B from `Folder Editor Polish.html`:
// slim header with `extensions / <name> /` breadcrumb, file tabs above the
// editor, accent status bar at the bottom.
function ExtensionEditor({ extension, onClose, onSave }) {
  const runtime = extension?.runtime || "worker";
  const seed = extension?.tree || seedTreeFor(runtime);
  const firstFile = runtime === "deno" ? "index.ts" : "src/index.js";

  const [files, setFiles]   = React.useState(seed);
  const [active, setActive] = React.useState(firstFile);
  const [openTabs, setOpenTabs] = React.useState([firstFile]);
  const [dirty, setDirty]   = React.useState(() => new Set());
  const [name, setName]     = React.useState(extension?.name || (runtime === "deno" ? "Open-Meteo" : "Hacker News"));
  const [aiOpen, setAiOpen] = React.useState(true);
  const folderId = name.toLowerCase().replace(/\s+/g, "-");

  // Wait for the ESM-loaded libraries to settle.
  const [libsReady, setLibsReady] = React.useState(!!window.ReactArborist && !!window.ReactCodeMirror);
  React.useEffect(() => {
    if (libsReady) return;
    const onReady = () => setLibsReady(true);
    window.addEventListener("extlibs-ready", onReady);
    return () => window.removeEventListener("extlibs-ready", onReady);
  }, [libsReady]);

  // Esc closes.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const treeData = React.useMemo(() => pathsToTree(Object.keys(files)), [files]);
  const totalLines = Object.values(files).reduce((s, c) => s + c.split("\n").length, 0);

  const openFile = (path) => {
    setActive(path);
    setOpenTabs(tabs => tabs.includes(path) ? tabs : [...tabs, path]);
  };
  const closeTab = (path, e) => {
    e?.stopPropagation();
    setOpenTabs(tabs => {
      const next = tabs.filter(t => t !== path);
      if (active === path && next.length) setActive(next[next.length - 1]);
      return next;
    });
  };
  const onChangeContent = (val) => {
    setFiles(f => f[active] === val ? f : ({ ...f, [active]: val }));
    setDirty(d => { if (d.has(active)) return d; const n = new Set(d); n.add(active); return n; });
  };
  const isReadonly = (path) => path === "deno.json";

  // ── Tree node renderer ───────────────────────────────────────────────────
  const Node = ({ node, style, dragHandle }) => {
    const isDir = node.isInternal;
    const ic = fileIconFor(isDir ? node.data.name + "/" : node.data.name);
    const on = !isDir && node.data.id === active;
    return (
      <div
        key={node.data.id}
        ref={dragHandle}
        style={{
          ...style,
          display: "flex", alignItems: "center", gap: 6,
          paddingLeft: style.paddingLeft, paddingRight: 8,
          height: 26, cursor: "pointer",
          background: on ? "var(--bg-card-elevated)" : "transparent",
          borderLeft: `2px solid ${on ? "var(--color-accent)" : "transparent"}`,
        }}
        onClick={() => { isDir ? node.toggle() : openFile(node.data.id); }}
      >
        {isDir
          ? <Icon name={node.isOpen ? "chevron-down" : "chevron-right"} size={10} color="var(--fg3)" />
          : <span style={{ width: 10, display: "inline-block" }}></span>}
        <Icon name={ic.name} size={11} color={ic.color} />
        <span style={{
          flex: 1, fontFamily: "var(--font-mono)", fontSize: 11.5,
          color: on ? "var(--fg1)" : "var(--fg2)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{node.data.name}</span>
        {!isDir && dirty.has(node.data.id) && (
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--color-orange)" }}></span>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          flex: `0 0 ${aiOpen ? 1240 : 940}px`, minWidth: 0, maxWidth: "100%",
          height: "min(680px, 90vh)",
          background: "var(--bg-window)", border: "1px solid var(--stroke-soft)",
          borderRadius: 12, boxShadow: "var(--elev-4)", overflow: "hidden",
          display: "flex", flexDirection: "column",
          transition: "flex-basis 200ms var(--ease-standard)",
        }}
      >
        {/* Slim header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px", background: "var(--bg-card)",
          borderBottom: "1px solid var(--stroke-hairline)",
        }}>
          <Icon name="folder" size={14} color="var(--color-accent)" />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 12, minWidth: 0 }}>
            <span style={{ color: "var(--fg3)" }}>extensions /</span>
            <input value={folderId} onChange={e => setName(e.target.value)}
                   style={{ background: "transparent", border: "none", outline: "none", color: "var(--fg1)", fontFamily: "inherit", fontSize: "inherit", width: Math.max(96, folderId.length * 8 + 8) }} />
            <span style={{ color: "var(--fg3)" }}>/</span>
          </div>
          {window.RuntimeChip && <window.RuntimeChip runtime={runtime} />}
          <span style={{ flex: 1 }}></span>
          <button onClick={() => setAiOpen(o => !o)} className="btn" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 6, border: "none",
            background: aiOpen ? "var(--color-accent-tint)" : "transparent",
            color: aiOpen ? "var(--color-accent)" : "var(--fg2)",
            fontSize: 11.5, fontWeight: aiOpen ? 600 : 500, cursor: "pointer",
          }}>
            <Icon name="sparkles" size={12} color={aiOpen ? "var(--color-accent)" : "var(--fg2)"} />Ask AI
          </button>
          <Button variant="clear" size="sm" icon="play">Test</Button>
          <Button variant="primary" size="sm" icon="check" onClick={() => onSave?.({ name, tree: files, runtime })}>Save</Button>
          <button className="btn btn-icon" onClick={onClose}><Icon name="x" size={14} color="var(--fg2)" /></button>
        </div>

        {/* Body — tree + editor */}
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>

          {/* Tree rail (react-arborist) */}
          <div style={{
            width: 220, shrink: 0, display: "flex", flexDirection: "column",
            background: "var(--bg-card)", borderRight: "1px solid var(--stroke-hairline)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderBottom: "1px solid var(--stroke-hairline)" }}>
              <span style={{ flex: 1, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, color: "var(--fg3)" }}>Files</span>
              <button className="btn btn-icon" title="New file"><Icon name="file-plus" size={12} color="var(--fg2)" /></button>
              <button className="btn btn-icon" title="New folder"><Icon name="folder-plus" size={12} color="var(--fg2)" /></button>
              <button className="btn btn-icon" title="Find file (⌘P)"><Icon name="search" size={12} color="var(--fg2)" /></button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              {libsReady ? (
                <window.ReactArborist.Tree
                  data={treeData}
                  openByDefault={true}
                  width={220}
                  height={500}
                  indent={14}
                  rowHeight={26}
                  paddingTop={4}
                  paddingBottom={8}
                  disableEdit={true}
                  disableDrag={true}
                  disableDrop={true}
                  disableMultiSelection={true}
                >
                  {Node}
                </window.ReactArborist.Tree>
              ) : (
                <div style={{ padding: 14, fontSize: 11, color: "var(--fg3)", fontFamily: "var(--font-mono)" }}>
                  loading file tree…
                </div>
              )}
            </div>

            <div style={{ padding: "8px 10px", borderTop: "1px solid var(--stroke-hairline)", fontSize: 10, color: "var(--fg3)", lineHeight: 1.45 }}>
              {runtime === "deno" ? "deno cache warms on save" : "esbuild bundles on save"}
            </div>
          </div>

          {/* Editor pane */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

            {/* Tab strip */}
            <div style={{
              display: "flex", alignItems: "stretch", height: 28,
              background: "var(--bg-card-elevated)", borderBottom: "1px solid var(--stroke-hairline)",
            }}>
              {openTabs.map(tab => {
                const ic = fileIconFor(tab);
                const on = tab === active;
                return (
                  <div
                    key={tab}
                    onClick={() => setActive(tab)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "0 12px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11,
                      background: on ? "var(--bg-window)" : "transparent",
                      color: on ? "var(--fg1)" : "var(--fg3)",
                      borderRight: "1px solid var(--stroke-hairline)",
                      borderBottom: on ? "2px solid var(--color-accent)" : "2px solid transparent",
                      marginBottom: -1,
                    }}
                  >
                    <Icon name={ic.name} size={10} color={ic.color} />
                    <span>{tab}</span>
                    {dirty.has(tab) && <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--color-orange)" }}></span>}
                    <button className="btn btn-icon" onClick={(e) => closeTab(tab, e)} style={{ marginLeft: 4 }}>
                      <Icon name="x" size={10} color="var(--fg4)" />
                    </button>
                  </div>
                );
              })}
              <span style={{ flex: 1 }}></span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)", padding: "0 12px", alignSelf: "center" }}>
                {active.endsWith(".json") ? "JSON" : active.endsWith(".ts") ? "TypeScript" : "JavaScript"} · UTF-8
              </div>
            </div>

            {/* CodeMirror */}
            <div style={{ flex: 1, minHeight: 0, background: "var(--bg-window)" }}>
              {libsReady ? (
                <window.ReactCodeMirror.default
                  value={files[active] ?? ""}
                  onChange={onChangeContent}
                  height="100%"
                  theme={window.ReactCodeMirror.oneDark}
                  readOnly={isReadonly(active)}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: false,
                    bracketMatching: true,
                    autocompletion: true,
                    closeBrackets: true,
                  }}
                  extensions={langFor(active)}
                  style={{ height: "100%", fontFamily: "var(--font-mono)", fontSize: 12.5 }}
                />
              ) : (
                <div style={{ padding: 16, fontSize: 11, color: "var(--fg3)", fontFamily: "var(--font-mono)" }}>
                  loading editor…
                </div>
              )}
            </div>

            {/* Accent status bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, height: 22,
              padding: "0 12px", background: "var(--color-accent)", color: "white",
              fontFamily: "var(--font-mono)", fontSize: 10.5,
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="git-branch" size={10} color="white" />draft
              </span>
              <span style={{ opacity: 0.7 }}>·</span>
              <span>{Object.keys(files).length} files</span>
              <span style={{ opacity: 0.7 }}>·</span>
              <span>{totalLines} lines</span>
              {dirty.size > 0 && (<>
                <span style={{ opacity: 0.7 }}>·</span>
                <span>{dirty.size} modified</span>
              </>)}
              <span style={{ flex: 1 }}></span>
              <span>{active}</span>
              <span style={{ opacity: 0.7 }}>·</span>
              <span>{isReadonly(active) ? "read-only" : "LF"}</span>
            </div>
          </div>

          {/* AI column — panel when open, slim rail when collapsed */}
          {aiOpen
            ? <AskAIPanel files={files} active={active} onClose={() => setAiOpen(false)} onOpenFile={openFile} />
            : <CollapsedAIRail onOpen={() => setAiOpen(true)} unread={1} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SecretsPanel, ExtensionEditor, AskAIPanel, CollapsedAIRail, AddSecretSheet, SECRETS_SEED });
