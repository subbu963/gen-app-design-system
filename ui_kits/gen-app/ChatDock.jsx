/* Chat dock — variant A (persistent dock, bottom-right).
   Used on desktop always; used on iOS in dock-variant-A mode.
   Sends fake user messages and triggers widget creation via onCreate(kind, spec).
*/

function ChatDock({ messages, onSend, expanded, onToggle, mode = "dock", addressed = [], widgets = [], onClearAddressed, onClearChat, onNewSession, sessions = [], onRestoreSession, onDeleteSession, contextLabel }) {
  const [input, setInput] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const bodyRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, expanded]);

  // close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const send = (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    onSend?.(input.trim(), addressed);
    setInput("");
  };

  // Resolve addressed widget IDs → symbols for display in the addressing strip
  const addressedSymbols = React.useMemo(() => {
    return addressed.map(id => {
      const w = widgets.find(x => x.id === id);
      return w ? (w.symbol || w.kind) : id;
    });
  }, [addressed, widgets]);

  // Suggested chips when no user message yet AND nothing addressed
  const showChips = messages.filter(m => m.role === "user").length === 0 && addressed.length === 0;

  // Collapsed → render a Messenger-style floating chat head, not the full dock chrome
  if (!expanded && mode !== "inline") {
    return (
      <button className="dock-fab" onClick={onToggle} title="Open chat">
        <div className="dock-fab-icon">
          <Icon name="sparkles" size={20} color="white" />
        </div>
        {addressed.length > 0 && (
          <span className="dock-fab-badge">{addressed.length}</span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`dock ${mode === "inline" ? "dock-inline" : ""}`}
      style={mode === "inline" ? {
        position: "static", width: "100%", maxWidth: "none",
        borderRadius: 0, border: "none", boxShadow: "none", background: "transparent",
        backdropFilter: "none", WebkitBackdropFilter: "none"
      } : {
        height: 380
      }}
    >
      {mode !== "inline" && (
        <div className="dock-head">
          <div className="ic" onClick={onToggle} style={{ cursor: "pointer" }}><Icon name="sparkles" size={12} color="white" /></div>
          <div className="ttl" onClick={onToggle} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
            <span>Chat</span>
            {contextLabel && (
              <span style={{ color: "var(--fg2)", marginLeft: 4, fontWeight: 400 }}>· {contextLabel}</span>
            )}
            {addressed.length > 0 && (
              <span style={{ color: "var(--color-accent)", marginLeft: 6, fontSize: 11, fontWeight: 500 }}>
                · addressing {addressed.length}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              className="dock-head-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              title="More"
            >
              <Icon name="more-horizontal" size={14} color="var(--fg2)" />
            </button>
            {menuOpen && (
              <div className="dock-head-menu" onClick={e => e.stopPropagation()}>
                <button className="dock-head-menu-row" onClick={() => { onNewSession?.(); setMenuOpen(false); }}>
                  <Icon name="plus" size={13} color="var(--color-accent)" />
                  <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>New session</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>⌘ ⏎</span>
                </button>
                <div className="dock-head-menu-sep"></div>
                <button className="dock-head-menu-row" onClick={() => { onClearChat?.(); setMenuOpen(false); }}>
                  <Icon name="eraser" size={13} color="var(--fg2)" />
                  <span>Clear chat</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{messages.length} msgs</span>
                </button>
                <button className="dock-head-menu-row" onClick={() => setMenuOpen(false)}>
                  <Icon name="download" size={13} color="var(--fg2)" />
                  <span>Export transcript</span>
                </button>
                <div className="dock-head-menu-sep"></div>
                <button className="dock-head-menu-row" onClick={() => { setMenuOpen(false); setHistoryOpen(true); }}>
                  <Icon name="history" size={13} color="var(--fg2)" />
                  <span>Session history</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{sessions.length}</span>
                </button>
              </div>
            )}
          </div>
          <button className="dock-head-btn" onClick={onToggle} title={expanded ? "Collapse" : "Expand"}>
            <Icon name={expanded ? "chevron-down" : "chevron-up"} size={14} color="var(--fg2)" />
          </button>
        </div>
      )}
      <div className="dock-body" ref={bodyRef}>
        {messages.map((m, i) => {
          if (m.role === "system") return <div key={i} className="msg system">{m.content}</div>;
          if (m.role === "thinking") return (
            <div key={i} className="msg thinking">
              <span className="dots"><span></span><span></span><span></span></span>
              {m.content}
            </div>
          );
          return <div key={i} className={`msg ${m.role}`}>{renderMessageBody(m.content)}</div>;
        })}
        {showChips && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {["Weather in Brooklyn", "AAPL stock chart", "Today's calendar"].map(c => (
              <button key={c} className="btn btn-secondary btn-sm" onClick={() => onSend?.(c, [])}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {addressed.length > 0 && (
        <div className="dock-address">
          <span className="dock-address-label">Addressing</span>
          {addressedSymbols.map((s, i) => (
            <span key={i} className="symbol-chip">@{s}</span>
          ))}
          <button className="dock-address-clear" onClick={onClearAddressed}>×</button>
        </div>
      )}

      <form className="dock-composer" onSubmit={send}>
        <input
          className="dock-input"
          placeholder={addressed.length > 0 ? "Ask the model to change them…" : "Ask for a widget…"}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="dock-send" type="submit" disabled={!input.trim()}>
          <Icon name="arrow-up" size={16} color="white" />
        </button>
      </form>

      {historyOpen && (
        <SessionHistorySheet
          sessions={sessions}
          onRestore={onRestoreSession}
          onDelete={onDeleteSession}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

function SessionHistorySheet({ sessions, onRestore, onDelete, onClose }) {
  return (
    <div className="dock-history" onClick={e => e.stopPropagation()}>
      <div className="dock-history-head">
        <Icon name="history" size={14} color="var(--fg2)" />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--fg1)" }}>Session history</span>
        <span style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--font-mono)" }}>{sessions.length}</span>
        <button className="dock-head-btn" onClick={onClose} title="Back">
          <Icon name="x" size={14} color="var(--fg2)" />
        </button>
      </div>
      {sessions.length === 0 ? (
        <div className="dock-history-empty">
          <div className="dock-history-empty-mark">
            <Icon name="history" size={20} color="var(--fg3)" />
          </div>
          <div style={{ fontFamily: "var(--font-brand)", fontStyle: "italic", fontSize: 18, color: "var(--fg1)", lineHeight: 1 }}>
            No past sessions yet.
          </div>
          <div style={{ fontSize: 12, color: "var(--fg2)", textAlign: "center", maxWidth: 220, lineHeight: 1.4 }}>
            Start a chat, then hit <strong style={{ color: "var(--color-accent)" }}>New session</strong> to keep it.
          </div>
        </div>
      ) : (
        <div className="dock-history-list">
          {sessions.map(s => (
            <div key={s.id} className="dock-history-row">
              <button className="dock-history-row-main" onClick={() => { onRestore(s.id); onClose(); }}>
                <div className="dock-history-row-name">{s.name}</div>
                <div className="dock-history-row-meta">
                  <span>{relativeTime(s.endedAt)}</span>
                  <span style={{ color: "var(--fg4)" }}>·</span>
                  <span>{s.msgCount} {s.msgCount === 1 ? "msg" : "msgs"}</span>
                </div>
              </button>
              <button className="dock-history-row-delete" onClick={() => onDelete(s.id)} title="Delete session">
                <Icon name="trash-2" size={13} color="var(--color-red)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " min ago";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + " hr ago";
  return new Date(ts).toLocaleDateString();
}

/* Render @symbols inline as chips */function renderMessageBody(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(@\w[\w-]*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("@")) return <span key={i} className="symbol-chip inline">{p}</span>;
    return p;
  });
}

window.ChatDock = ChatDock;
window.renderMessageBody = renderMessageBody;
