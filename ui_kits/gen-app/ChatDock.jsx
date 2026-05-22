/* Chat dock — variant A (persistent dock, bottom-right).
   Used on desktop always; used on iOS in dock-variant-A mode.
   Sends fake user messages and triggers widget creation via onCreate(kind, spec).
*/

function ChatDock({ messages, onSend, expanded, onToggle, mode = "dock", addressed = [], widgets = [], onClearAddressed }) {
  const [input, setInput] = React.useState("");
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, expanded]);

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
        <div className="dock-head" onClick={onToggle}>
          <div className="ic"><Icon name="sparkles" size={12} color="white" /></div>
          <div className="ttl">
            Chat
            {addressed.length > 0 && (
              <span style={{ color: "var(--color-accent)", marginLeft: 6, fontSize: 11, fontWeight: 500 }}>
                · addressing {addressed.length}
              </span>
            )}
          </div>
          <Icon name={expanded ? "chevron-down" : "chevron-up"} size={16} color="var(--fg2)" />
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
    </div>
  );
}

/* Render @symbols inline as chips */
function renderMessageBody(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(@\w[\w-]*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("@")) return <span key={i} className="symbol-chip inline">{p}</span>;
    return p;
  });
}

window.ChatDock = ChatDock;
window.renderMessageBody = renderMessageBody;
