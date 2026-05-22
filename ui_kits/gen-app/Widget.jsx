/* Widget — declarative spec renderer.
   The model emits { kind, props } and the canvas mounts the matching component.
   This is the only place widget-specific visuals live. */

function WidgetShell({ title, children, selected, status, onSelect, isNew, symbol, onDelete, onAddressInChat, onRetag }) {
  const [popping, setPopping] = React.useState(!!isNew);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (popping) {
      const t = setTimeout(() => setPopping(false), 400);
      return () => clearTimeout(t);
    }
  }, [popping]);

  // close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleMore = (e) => {
    e.stopPropagation();
    setMenuOpen(o => !o);
  };

  return (
    <div className={`widget ${selected ? "selected" : ""} ${popping ? "popping" : ""} ${symbol ? "has-symbol" : ""}`} onClick={onSelect}>
      {symbol ? <div className="widget-symbol">@{symbol}</div> : null}
      <div className="widget-head">
        <div className="widget-ttl">{title}</div>
        <div className="row" style={{ gap: 6 }}>
          {status ? <StatusPill {...status} /> : null}
          <div className="widget-more" onClick={handleMore} aria-label="Widget options">⋯</div>
        </div>
      </div>
      {children}

      {menuOpen && (
        <div className="widget-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
          <button className="widget-menu-row" onClick={() => { onAddressInChat?.(); setMenuOpen(false); }}>
            <Icon name="message-circle" size={14} color="var(--fg2)" />
            <span>Address in chat</span>
          </button>
          <button className="widget-menu-row" onClick={() => { onRetag?.(); setMenuOpen(false); }}>
            <Icon name="tag" size={14} color="var(--fg2)" />
            <span>Edit @symbol{symbol ? ` — @${symbol}` : ""}</span>
          </button>
          <button className="widget-menu-row" onClick={() => { setMenuOpen(false); }}>
            <Icon name="copy" size={14} color="var(--fg2)" />
            <span>Duplicate</span>
          </button>
          <div className="widget-menu-sep"></div>
          <button className="widget-menu-row widget-menu-destructive" onClick={() => { onDelete?.(); setMenuOpen(false); }}>
            <Icon name="trash-2" size={14} color="var(--color-red)" />
            <span>Toss</span>
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ tone = "neutral", label }) {
  const map = {
    live:    { bg: "var(--tint-green)",  fg: "var(--color-green)" },
    stale:   { bg: "var(--tint-orange)", fg: "var(--color-orange)" },
    error:   { bg: "var(--tint-red)",    fg: "var(--color-red)" },
    pending: { bg: "var(--tint-yellow)", fg: "var(--color-yellow)" },
    neutral: { bg: "var(--bg-base)",     fg: "var(--fg2)" },
  };
  const c = map[tone] || map.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600,
      background: c.bg, color: c.fg
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: c.fg }}></span>
      {label}
    </span>
  );
}

function WeatherWidget({ city, temp, hi, lo, condition, ago, selected, onSelect, symbol, isNew, onDelete, onAddressInChat, onRetag }) {
  return (
    <WidgetShell title={city} status={{ tone: "live", label: ago }} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "radial-gradient(circle, #FFD60A 0%, #FF9F0A 100%)",
          boxShadow: "0 0 20px rgba(255,159,10,0.45)"
        }}></div>
        <div>
          <div className="widget-big">{temp}°</div>
          <div className="widget-meta">{condition}</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: "auto", fontSize: 11, color: "var(--fg2)" }}>
        <span>↑ {hi}°</span><span>↓ {lo}°</span>
      </div>
    </WidgetShell>
  );
}

function StockWidget({ ticker, name, price, delta, pct, selected, onSelect, symbol, isNew, onDelete, onAddressInChat, onRetag }) {
  const up = delta >= 0;
  const color = up ? "var(--color-green)" : "var(--color-red)";
  const fill = up ? "rgba(48,209,88,0.15)" : "rgba(255,69,58,0.15)";
  const pts = up
    ? "0,30 18,26 34,28 50,20 66,22 84,16 100,18 118,12 134,14 150,8 168,6 200,4"
    : "0,4 18,8 34,6 50,14 66,12 84,18 100,16 118,22 134,20 150,28 168,26 200,30";
  return (
    <WidgetShell title={`${ticker} · ${name}`} status={{ tone: "live", label: "1 min" }} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
      <div className="widget-big">${price}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color }}>
        {up ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} ({pct}%)
      </div>
      <svg viewBox="0 0 200 36" preserveAspectRatio="none" style={{ width: "100%", height: 32, marginTop: "auto" }}>
        <polyline fill="none" stroke={color} strokeWidth="1.8" points={pts}/>
        <polyline fill={fill} stroke="none" points={`${pts} 200,36 0,36`}/>
      </svg>
    </WidgetShell>
  );
}

function CalendarWidget({ date, events, selected, onSelect, symbol, isNew, onDelete, onAddressInChat, onRetag }) {
  return (
    <WidgetShell title={`Today · ${date}`} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
      <div className="col" style={{ gap: 4, marginTop: 2 }}>
        {events.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, padding: "4px 0", borderBottom: i < events.length - 1 ? "1px solid var(--stroke-hairline)" : "none" }}>
            <div style={{ color: "var(--fg2)", fontFamily: "var(--font-mono)", fontSize: 11, minWidth: 40 }}>{e.time}</div>
            <div style={{ color: "var(--fg1)" }}>{e.title}</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

function PendingWidget({ prompt, selected, onSelect, symbol, isNew, onDelete, onAddressInChat, onRetag }) {
  return (
    <WidgetShell title="Cooking up…" status={{ tone: "pending", label: "pending" }} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
      <div style={{ fontSize: 13, color: "var(--fg2)", fontStyle: "italic", marginTop: 4 }}>"{prompt}"</div>
      <div style={{ marginTop: "auto", display: "flex", gap: 6, alignItems: "center", color: "var(--fg3)", fontSize: 11 }}>
        <span className="thinking" style={{ display: "inline-flex" }}>
          <span className="dots"><span></span><span></span><span></span></span>
        </span>
        Asking the model
      </div>
    </WidgetShell>
  );
}

/* Render any widget by kind */
function Widget(props) {
  const Comp = ({
    weather:  WeatherWidget,
    stock:    StockWidget,
    calendar: CalendarWidget,
    pending:  PendingWidget
  })[props.kind] || (() => null);
  return <Comp {...props} />;
}

Object.assign(window, { Widget, WidgetShell, WeatherWidget, StockWidget, CalendarWidget, PendingWidget });
