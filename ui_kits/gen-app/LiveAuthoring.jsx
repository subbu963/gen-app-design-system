/* Live authoring — the in-app code editor that appears WHILE the agent is
   writing an extension or glue widget in chat.

   Three presentations, chosen in Settings → Developer → Live coding:
     • "pill"   — a minimized progress pill, canvas fully visible
     • "float"  — a floating editor card over a dimmed canvas (default)
     • "focus"  — a larger centred sheet that takes attention

   The editor is always a FLOATING overlay — it never reflows the canvas or
   the chat dock (both keep their real layout). Exploration lived in
   `Live Editor Mockups.html`; this is the wired version.

   Exposes on window: getLiveCodingMode, setLiveCodingMode, useLiveCodingMode,
   useAuthoring, LiveAuthoringOverlay, LiveCodingPanel, matchExtension.
*/

/* ---------- Persisted setting ---------- */
const LIVECODING_KEY = "genapp-livecoding";
const LIVECODING_DEFAULT = { display: "float", pauseOnRead: true, autoClose: false };

function getLiveCodingMode() {
  try {
    const raw = localStorage.getItem(LIVECODING_KEY);
    return raw ? { ...LIVECODING_DEFAULT, ...JSON.parse(raw) } : { ...LIVECODING_DEFAULT };
  } catch { return { ...LIVECODING_DEFAULT }; }
}
function setLiveCodingMode(patch) {
  const next = { ...getLiveCodingMode(), ...patch };
  try { localStorage.setItem(LIVECODING_KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new CustomEvent("genapp-livecoding", { detail: next }));
  return next;
}
function useLiveCodingMode() {
  const [mode, setMode] = React.useState(getLiveCodingMode);
  React.useEffect(() => {
    const on = (e) => setMode(e.detail || getLiveCodingMode());
    window.addEventListener("genapp-livecoding", on);
    return () => window.removeEventListener("genapp-livecoding", on);
  }, []);
  return mode;
}

/* ---------- Tiny syntax highlighter for the streaming view ----------
   Read-only, so a regex tokenizer beats mounting CodeMirror per keystroke. */
function highlightLine(line, lang) {
  if (line === "") return [<span key="e">{"\u200b"}</span>];
  // comments win outright
  const cmt = line.match(/^(\s*)(\/\/.*)$/);
  if (cmt) return [<span key="i">{cmt[1]}</span>, <span key="c" className="la-cmt">{cmt[2]}</span>];

  const tokens = [];
  // split on strings first so keywords inside strings aren't recolored
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  let last = 0, m, k = 0;
  const pushCode = (txt) => {
    // keyword + number coloring inside code spans
    const parts = txt.split(/(\b(?:const|let|var|async|await|return|import|from|export|new|if|else|function|interface|type|as|of|for|while|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g);
    parts.forEach((p) => {
      if (!p) return;
      if (/^(const|let|var|async|await|return|import|from|export|new|if|else|function|interface|type|as|of|for|while|true|false|null|undefined)$/.test(p))
        tokens.push(<span key={k++} className="la-kw">{p}</span>);
      else if (/^\d+(?:\.\d+)?$/.test(p))
        tokens.push(<span key={k++} className="la-num">{p}</span>);
      else tokens.push(<span key={k++}>{p}</span>);
    });
  };
  while ((m = re.exec(line))) {
    if (m.index > last) pushCode(line.slice(last, m.index));
    tokens.push(<span key={k++} className="la-str">{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) pushCode(line.slice(last));
  return tokens;
}

/* ---------- Extension seeds (what the agent "writes") ---------- */
const HN_EXT = {
  id: "hacker-news",
  folder: "extensions/hacker-news",
  runtime: "worker",
  order: ["manifest.json", "src/index.js"],
  files: {
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
    { "name": "top", "description": "Top N front-page posts." }
  ],
  "widgets": [{ "name": "topStories", "defaultBinding": "top" }]
}`,
    "src/index.js":
`// Worker-runtime provider. ctx is the only host capability bag:
// no DOM, no Tauri — ctx.fetch is brokered + allowlisted.
const API = "https://hn.algolia.com/api/v1/search?tags=front_page";

export const top = async ({ limit = 5 }, ctx) => {
  const res = await ctx.fetch(API);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const { hits } = JSON.parse(res.body);
  return hits.slice(0, limit).map((h) => ({
    title: h.title,
    meta: h.points + " pts \\u00b7 " + h.num_comments + " comments",
    url: h.url,
  }));
};`,
  },
  widget: {
    kind: "list", symbol: "hn", title: "Hacker News · Top",
    items: [
      { title: "Apple unveils the M5 lineup", meta: "324 pts · 187 comments" },
      { title: "Why Postgres is the new default", meta: "211 pts · 92 comments" },
      { title: "The quiet death of the side project", meta: "98 pts · 184 comments" },
      { title: "Show HN: I built a tiny Deno sandbox", meta: "76 pts · 41 comments" },
      { title: "A love letter to the command line", meta: "64 pts · 28 comments" },
    ],
  },
};

const RSS_EXT = {
  id: "rss",
  folder: "extensions/rss",
  runtime: "worker",
  order: ["manifest.json", "src/index.js"],
  files: {
    "manifest.json":
`{
  "id": "rss",
  "name": "RSS",
  "version": "0.1.0",
  "description": "Subscribe + summarise a feed.",
  "runtime": "worker",
  "capabilities": ["network"],
  "permissions": { "network": ["*"], "secrets": [] },
  "providers": [{ "name": "items", "description": "Latest feed items." }],
  "widgets": [{ "name": "feed", "defaultBinding": "items" }]
}`,
    "src/index.js":
`export const items = async ({ url, limit = 5 }, ctx) => {
  const res = await ctx.fetch(url);
  const xml = res.body;
  const titles = [...xml.matchAll(/<title>(.*?)<\\/title>/g)].map((m) => m[1]);
  return titles.slice(1, limit + 1).map((t) => ({ title: t }));
};`,
  },
  widget: {
    kind: "list", symbol: "feed", title: "Feed · latest",
    items: [
      { title: "The case for boring technology" },
      { title: "Notes on distributed systems" },
      { title: "What I learned shipping daily" },
    ],
  },
};

/* Match a chat prompt → an extension spec to author (or null). */
function matchExtension(text) {
  const t = (text || "").toLowerCase();
  if (/(hacker.?news|hacker news|\bhn\b)/.test(t)) return HN_EXT;
  if (/\brss\b|\bfeed\b/.test(t)) return RSS_EXT;
  if (/extension/.test(t) && /(add|make|build|write|create)/.test(t)) return HN_EXT;
  return null;
}

/* ---------- Authoring state machine ---------- */
function useAuthoring() {
  const [session, setSession] = React.useState(null);

  const start = (spec, onApply) => {
    const m = getLiveCodingMode();
    const view = m.display === "pill" ? "min" : m.display; // 'min' | 'float' | 'focus'
    setSession({
      id: spec.id, folder: spec.folder, runtime: spec.runtime,
      files: spec.files, order: spec.order,
      activeFile: spec.order[0],
      typed: Object.fromEntries(spec.order.map((p) => [p, 0])),
      status: "writing", view, autoClose: m.autoClose,
      onApply, widget: spec.widget,
    });
  };

  // Streaming: type the active file, then advance; mark done when all typed.
  React.useEffect(() => {
    if (!session || session.status !== "writing") return;
    const tid = setInterval(() => {
      setSession((s) => {
        if (!s || s.status !== "writing") return s;
        const path = s.activeFile;
        const full = s.files[path];
        const n = s.typed[path] || 0;
        if (n < full.length) {
          return { ...s, typed: { ...s.typed, [path]: Math.min(full.length, n + 13) } };
        }
        const idx = s.order.indexOf(path);
        const nextPath = s.order.slice(idx + 1).find((p) => (s.typed[p] || 0) < s.files[p].length);
        if (nextPath) return { ...s, activeFile: nextPath };
        return { ...s, status: "done" };
      });
    }, 24);
    return () => clearInterval(tid);
  }, [session?.status, session?.activeFile]);

  const pause  = () => setSession((s) => s && s.status === "writing" ? { ...s, status: "paused" } : s);
  const resume = () => setSession((s) => s && s.status === "paused" ? { ...s, status: "writing" } : s);
  const setView = (view) => setSession((s) => s ? { ...s, view } : s);
  const setActive = (path) => setSession((s) => s ? { ...s, activeFile: path } : s);
  const close   = () => setSession(null);
  const apply   = () => setSession((s) => { s?.onApply?.(); return null; });

  return { session, start, pause, resume, setView, setActive, close, apply };
}

/* ---------- Streaming code view ---------- */
function StreamView({ session }) {
  const full = session.files[session.activeFile];
  const shown = full.slice(0, session.typed[session.activeFile] || 0);
  const lines = shown.split("\n");
  const writing = session.status === "writing";
  return (
    <div className="la-code">
      {lines.map((ln, i) => (
        <div key={i} className="la-line">
          <span className="la-ln">{i + 1}</span>
          <span className="la-src">
            {highlightLine(ln, session.activeFile)}
            {writing && i === lines.length - 1 && <span className="la-caret"></span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- File tab strip ---------- */
function TabStrip({ session, onPick }) {
  return (
    <div className="la-tabs">
      {session.order.map((p) => {
        const name = p.split("/").pop();
        const on = p === session.activeFile;
        const done = (session.typed[p] || 0) >= session.files[p].length;
        return (
          <button key={p} className={`la-tab ${on ? "on" : ""}`} onClick={() => onPick(p)}>
            <Icon name="file-code" size={11} color={name.endsWith(".json") ? "var(--color-green)" : "var(--color-purple)"} />
            <span>{name}</span>
            {!done && on && session.status === "writing"
              ? <span className="la-dot run"></span>
              : !done ? <span className="la-tab-new">new</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- The overlay (float / focus / min) ---------- */
function LiveAuthoringOverlay({ authoring }) {
  const { session } = authoring;

  // auto-close when done, if the setting asks for it (never in focus mode).
  React.useEffect(() => {
    if (!session || session.status !== "done" || !session.autoClose || session.view === "focus") return;
    const t = setTimeout(() => authoring.close(), 1400);
    return () => clearTimeout(t);
  }, [session?.status, session?.view]);

  // Esc closes
  React.useEffect(() => {
    if (!session) return;
    const onKey = (e) => { if (e.key === "Escape") authoring.close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  if (!session) return null;

  const done = session.status === "done";
  const paused = session.status === "paused";
  const typedFiles = session.order.filter((p) => (session.typed[p] || 0) >= session.files[p].length).length;

  /* — Minimized pill — */
  if (session.view === "min") {
    const pct = Math.round((typedFiles / session.order.length) * 100);
    return (
      <div className="la-pill">
        <div className="la-pill-ic"><Icon name="folder" size={14} color="var(--color-accent)" /></div>
        <div className="la-pill-body">
          <div className="la-pill-top">
            <span className="la-pill-name">{session.folder.split("/").pop()}/</span>
            <RuntimeChip runtime={session.runtime} />
          </div>
          <div className="la-pill-status">
            {done
              ? <><Icon name="check-circle-2" size={11} color="var(--color-green)" /><span style={{ color: "var(--color-green)" }}>ready to install</span></>
              : <><span className={`la-dot ${paused ? "" : "run"}`}></span><span style={{ color: paused ? "var(--color-orange)" : "var(--color-green)" }}>{paused ? "paused" : `writing ${session.activeFile.split("/").pop()}`}</span></>}
            <span style={{ color: "var(--fg4)" }}>·</span>
            <span style={{ color: "var(--fg3)" }}>{typedFiles}/{session.order.length} files</span>
          </div>
          <div className="la-bar"><div className="la-bar-fill" style={{ width: `${done ? 100 : pct || 8}%` }}></div></div>
        </div>
        <div className="la-pill-actions">
          {done
            ? <button className="la-btn primary" onClick={authoring.apply}>Apply</button>
            : <button className="la-icon" title={paused ? "Resume" : "Pause"} onClick={paused ? authoring.resume : authoring.pause}><Icon name={paused ? "play" : "pause"} size={14} color="var(--fg2)" /></button>}
          <button className="la-icon" title="Expand editor" onClick={() => authoring.setView("float")}><Icon name="maximize-2" size={14} color="var(--fg2)" /></button>
          <button className="la-icon" title="Close" onClick={authoring.close}><Icon name="x" size={14} color="var(--fg2)" /></button>
        </div>
      </div>
    );
  }

  /* — Floating / focus editor card — */
  const focus = session.view === "focus";
  return (
    <>
      <div className={`la-scrim ${focus ? "focus" : ""}`} onClick={focus ? undefined : () => authoring.setView("min")}></div>
      <div className={`la-card ${focus ? "focus" : ""}`}>
        {/* header */}
        <div className="la-head">
          <Icon name="grip-vertical" size={12} color="var(--fg4)" />
          <Icon name="folder" size={13} color="var(--color-accent)" />
          <span className="la-head-path">{session.folder}/</span>
          <RuntimeChip runtime={session.runtime} />
          <span style={{ flex: 1 }}></span>
          {!done && (
            <button className="la-icon" title={paused ? "Resume agent" : "Pause agent"} onClick={paused ? authoring.resume : authoring.pause}>
              <Icon name={paused ? "play" : "pause"} size={14} color="var(--fg2)" />
            </button>
          )}
          <button className="la-icon" title="Minimize to pill" onClick={() => authoring.setView("min")}><Icon name="minus" size={14} color="var(--fg2)" /></button>
          <button className="la-icon" title={focus ? "Float" : "Focus"} onClick={() => authoring.setView(focus ? "float" : "focus")}><Icon name={focus ? "minimize-2" : "maximize-2"} size={13} color="var(--fg2)" /></button>
          <button className="la-icon" title="Close (esc)" onClick={authoring.close}><Icon name="x" size={14} color="var(--fg2)" /></button>
        </div>

        {/* tabs */}
        <TabStrip session={session} onPick={(p) => authoring.setActive(p)} />

        {/* status row */}
        <div className={`la-status ${done ? "done" : paused ? "paused" : "writing"}`}>
          {done
            ? <><Icon name="check-circle-2" size={12} color="var(--color-green)" /><span>Authored {session.order.length} files · ready to install</span></>
            : paused
              ? <><Icon name="pause" size={12} color="var(--color-orange)" /><span>Paused — the agent is holding the next write</span></>
              : <><span className="la-dot run"></span><span>Agent is writing…</span><span style={{ color: "var(--fg4)" }}>·</span><span style={{ color: "var(--fg2)" }}>tool: propose_change</span></>}
          <span style={{ flex: 1 }}></span>
          {!done && <button className="la-chip-btn" onClick={paused ? authoring.resume : authoring.pause}>{paused ? "Resume" : "Pause"}</button>}
        </div>

        {/* code */}
        <div className="la-body"><StreamView session={session} /></div>

        {/* footer */}
        <div className="la-foot">
          <Icon name="git-branch" size={12} color="var(--fg3)" />
          <span className="la-foot-meta">{done ? "draft · ready" : "draft · not saved"}</span>
          <span style={{ flex: 1 }}></span>
          <button className="la-btn ghost" onClick={authoring.close}>Reject all</button>
          <button className="la-btn primary" disabled={!done} onClick={authoring.apply}>{done ? "Apply & install" : "Writing…"}</button>
        </div>
      </div>
    </>
  );
}

/* ---------- Settings → Developer → Live coding panel ---------- */
function LiveCodingPanel() {
  const mode = useLiveCodingMode();
  const Radio = ({ value, title, sub }) => {
    const on = mode.display === value;
    return (
      <button onClick={() => setLiveCodingMode({ display: value })} style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10,
        textAlign: "left", cursor: "pointer", width: "100%",
        background: on ? "var(--color-accent-tint)" : "var(--bg-card)",
        border: `1px solid ${on ? "var(--color-accent)" : "var(--stroke-soft)"}`,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: 999, marginTop: 1, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: on ? "var(--color-accent)" : "var(--bg-card-elevated)",
          border: on ? "none" : "1px solid var(--stroke-soft)",
        }}>{on && <span style={{ width: 6, height: 6, borderRadius: 999, background: "white" }}></span>}</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>{title}</span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--fg2)", lineHeight: 1.5, marginTop: 2 }}>{sub}</span>
        </span>
      </button>
    );
  };
  const Toggle = ({ k, title, sub }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingRight: 12 }}>
        <span style={{ fontSize: 12.5, color: "var(--fg1)" }}>{title}</span>
        <span style={{ fontSize: 10.5, color: "var(--fg2)", lineHeight: 1.4 }}>{sub}</span>
      </div>
      <button onClick={() => setLiveCodingMode({ [k]: !mode[k] })} style={{
        position: "relative", width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        border: "none", cursor: "pointer", background: mode[k] ? "var(--color-green)" : "var(--fg4)",
      }}>
        <span style={{ position: "absolute", top: 2, left: mode[k] ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "left 150ms" }}></span>
      </button>
    </div>
  );

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <div className="settings-section-label">When the agent edits code</div>
        <div className="footnote" style={{ marginTop: 2, marginBottom: 10 }}>
          While the agent authors an extension or glue widget in chat, decide how much room the editor gets. The editor always floats — it never reflows the canvas or the chat dock.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Radio value="pill"  title="Stay minimized (pill)" sub="A small progress pill, bottom-left. Canvas stays fully visible so you can watch the widget fill in. Expand any time." />
          <Radio value="float" title="Float the editor over the canvas" sub="A floating editor card over a dimmed canvas the moment the agent writes. Drag, minimize, or close it. Recommended." />
          <Radio value="focus" title="Open and focus" sub="A larger centred sheet that takes attention — for when you're co-authoring and want to read every line." />
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-section-label">Behaviour</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Toggle k="pauseOnRead" title="Pause agent when I'm reading" sub="After a write lands, hold the next tool-call until I look away or hit Resume." />
          <Toggle k="autoClose"   title="Auto-close when the turn ends" sub="Dismiss the editor as soon as the agent stops writing. Off keeps it open for review." />
        </div>
      </div>
      <div className="settings-section">
        <div className="footnote">
          Try it: ask the chat for <strong style={{ color: "var(--fg1)" }}>“add a hacker news widget”</strong> on the desktop canvas.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  getLiveCodingMode, setLiveCodingMode, useLiveCodingMode,
  useAuthoring, LiveAuthoringOverlay, LiveCodingPanel, matchExtension,
});
