/* Canvas — grid of widgets, optional empty hero, drag-and-drop is faked
   (selection works, drag does not — UI kits cut corners on functionality). */

function CanvasEmpty({ note }) {
  return (
    <div className="canvas-empty">
      <div className="canvas-empty-inner">
        <div className="canvas-empty-mark"><Icon name="sparkles" size={28} color="white" /></div>
        <div className="canvas-empty-ttl">Nothing here yet.</div>
        <div className="canvas-empty-sub">{note || "Ask for something in the dock below — a chart, a forecast, an agenda. We'll build it."}</div>
      </div>
    </div>
  );
}

function Canvas({ widgets, selected, onSelect, onDelete, onAddressInChat, onRetag }) {
  return (
    <div className="canvas">
      {widgets.length === 0
        ? <CanvasEmpty />
        : (
          <div className="canvas-grid">
            {widgets.map(w => (
              <Widget
                key={w.id}
                {...w}
                selected={selected.includes(w.id)}
                onSelect={(e) => { e.stopPropagation?.(); onSelect(w.id); }}
                onDelete={() => onDelete?.(w.id)}
                onAddressInChat={() => onAddressInChat?.(w.id)}
                onRetag={() => onRetag?.(w.id)}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}

/* Fullscreen chat (iOS variant B) — same data, different chrome. */
function ChatFullscreen({ messages, onSend, providerName = "Groq" }) {
  const [input, setInput] = React.useState("");
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput("");
  };

  const showChips = messages.filter(m => m.role === "user").length === 0;

  return (
    <div className="chat-full">
      <div className="chat-full-head">
        <div className="row-ic" style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-indigo))", width: 32, height: 32, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white" }}>
          <Icon name="sparkles" size={16} color="white" />
        </div>
        <div className="ttl-row">
          <div className="ttl">Chat</div>
          <div className="sub">{providerName} · widgets go to canvas →</div>
        </div>
      </div>
      <div className="chat-full-body" ref={bodyRef}>
        {messages.map((m, i) => {
          if (m.role === "system") return <div key={i} className="msg system">{m.content}</div>;
          if (m.role === "thinking") return (
            <div key={i} className="msg thinking">
              <span className="dots"><span></span><span></span><span></span></span>
              {m.content}
            </div>
          );
          return <div key={i} className={`msg ${m.role}`}>{m.content}</div>;
        })}
        {showChips && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {["Weather in Brooklyn", "AAPL stock chart", "Today's calendar"].map(c => (
              <button key={c} className="btn btn-secondary btn-sm" onClick={() => onSend?.(c)}>{c}</button>
            ))}
          </div>
        )}
      </div>
      <form className="dock-composer" onSubmit={send} style={{ borderTop: "1px solid var(--stroke-hairline)" }}>
        <input
          className="dock-input"
          placeholder="Ask for a widget…"
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

/* iOS tab bar (variant B only) */
function TabBar({ tabs, value, onChange }) {
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <div key={t.id} className={`tab ${value === t.id ? "on" : ""}`} onClick={() => onChange(t.id)}>
          <Icon name={t.icon} size={22} color={value === t.id ? "var(--color-accent)" : "var(--fg2)"} />
          <div>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Canvas, CanvasEmpty, ChatFullscreen, TabBar });
