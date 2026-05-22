/* Widget — declarative spec renderer.
   The model emits { kind, props } and the canvas mounts the matching component.
   This is the only place widget-specific visuals live. */

function WidgetShell({ title, children, selected, status, onSelect, isNew, symbol, onDelete, onAddressInChat, onRetag, kind, sourceSpec }) {
  const [popping, setPopping] = React.useState(!!isNew);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sourceOpen, setSourceOpen] = React.useState(false);
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
          <button className="widget-menu-row" onClick={() => { setMenuOpen(false); setSourceOpen(true); }}>
            <Icon name="code-2" size={14} color="var(--fg2)" />
            <span>View source</span>
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

      {sourceOpen && (
        <WidgetSourceSheet
          kind={kind}
          symbol={symbol}
          title={title}
          spec={sourceSpec}
          onClose={(e) => { e?.stopPropagation?.(); setSourceOpen(false); }}
        />
      )}
    </div>
  );
}

/* ---------- Per-kind widget composition ----------
   A widget = glue code + 1..N extensions + 1..N UI primitives.
   The glue code is a small React component that pulls data from
   extensions and composes primitives into the final widget. */
const WIDGET_GLUE = {
  weather: ["// @weather widget — glue code",
    "import { Card, Heading, Stat, StatRow, Icon } from \"@gen-app/components\";",
    "import { useExtension } from \"@gen-app/runtime\";",
    "",
    "export default function WeatherWidget({ symbol, city }) {",
    "  // Pulls live data from the open-meteo extension",
    "  const w = useExtension(\"open-meteo\", { city });",
    "",
    "  if (w.status === \"error\")   return <Card error>{w.message}</Card>;",
    "  if (w.status === \"pending\") return <Card pending>Loading…</Card>;",
    "",
    "  return (",
    "    <Card symbol={symbol}>",
    "      <Heading size=\"xs\" color=\"fg2\">{w.city}</Heading>",
    "      <StatRow>",
    "        <Icon name=\"sun\" gradient=\"orange\" />",
    "        <div>",
    "          <Stat>{w.temp}°</Stat>",
    "          <Heading size=\"xs\" color=\"fg2\">{w.condition}</Heading>",
    "        </div>",
    "      </StatRow>",
    "      <StatRow size=\"xs\" color=\"fg2\">",
    "        <span>↑ {w.hi}°</span>",
    "        <span>↓ {w.lo}°</span>",
    "      </StatRow>",
    "    </Card>",
    "  );",
    "}"].join("\n"),
  stock: ["// @market widget — glue code",
    "import { Card, Heading, Stat, Delta, Sparkline } from \"@gen-app/components\";",
    "import { useExtension } from \"@gen-app/runtime\";",
    "",
    "export default function StockWidget({ symbol, ticker = \"AAPL\" }) {",
    "  // Composes TWO extensions: live price + historical candles",
    "  const quote   = useExtension(\"yahoo-finance\",          { ticker });",
    "  const history = useExtension(\"yahoo-finance/history\",  { ticker, range: \"1mo\" });",
    "",
    "  return (",
    "    <Card symbol={symbol}>",
    "      <Heading size=\"xs\" color=\"fg2\">{quote.ticker} · {quote.name}</Heading>",
    "      <Stat>${quote.price?.toFixed(2)}</Stat>",
    "      <Delta value={quote.delta} pct={quote.pct} />",
    "      <Sparkline data={history.closes} color={quote.delta >= 0 ? \"green\" : \"red\"} />",
    "    </Card>",
    "  );",
    "}"].join("\n"),
  calendar: ["// @today widget — glue code",
    "import { Card, Heading, EventList } from \"@gen-app/components\";",
    "import { useExtension } from \"@gen-app/runtime\";",
    "",
    "export default function CalendarWidget({ symbol }) {",
    "  // Merges THREE sources into one agenda",
    "  const macos  = useExtension(\"macos-calendar\");",
    "  const google = useExtension(\"google-calendar\");",
    "  const todos  = useExtension(\"reminders\", { date: \"today\" });",
    "",
    "  const events = [",
    "    ...macos.events,",
    "    ...(google.events ?? []),",
    "    ...todos.items.map(t => ({ time: t.dueAt, title: t.title, kind: \"todo\" })),",
    "  ].sort((a, b) => a.time.localeCompare(b.time));",
    "",
    "  return (",
    "    <Card symbol={symbol}>",
    "      <Heading size=\"xs\" color=\"fg2\">Today · {macos.date}</Heading>",
    "      <EventList events={events} />",
    "    </Card>",
    "  );",
    "}"].join("\n"),
};

const WIDGET_EXTENSIONS = {
  weather: [
    { id: "open-meteo", file: "open-meteo.js", version: "1.2.0", summary: "Weather forecasts · 16-day", icon: "cloud-sun" },
  ],
  stock: [
    { id: "yahoo-finance", file: "yahoo-finance.js", version: "0.4.1", summary: "Live quote · 15-min delayed", icon: "trending-up" },
    { id: "yahoo-finance/history", file: "yahoo-finance.js", version: "0.4.1", summary: "Historical candles", icon: "bar-chart-3" },
  ],
  calendar: [
    { id: "macos-calendar",  file: "macos-calendar.js",  version: "native", summary: "EventKit bridge · today + 7 days", icon: "calendar" },
    { id: "google-calendar", file: "google-calendar.js", version: "0.3.0",  summary: "OAuth · primary calendar", icon: "calendar-clock" },
    { id: "reminders",       file: "reminders.js",       version: "native", summary: "EventKit bridge · today's todos", icon: "check-square" },
  ],
};

const EXTENSION_SOURCES = {
  "open-meteo": ["// open-meteo.js",
    "export const manifest = {",
    "  id: \"open-meteo\", version: \"1.2.0\", refresh: 60,",
    "  permissions: { network: [\"api.open-meteo.com\"], secrets: [\"UNIT\"] },",
    "  provides: [{ kind: \"weather\" }],",
    "};",
    "",
    "export async function run(ctx) {",
    "  const { lat = 40.6782, lon = -73.9442, city } = ctx.widget.props;",
    "  const url = new URL(\"https://api.open-meteo.com/v1/forecast\");",
    "  url.searchParams.set(\"latitude\", lat);",
    "  url.searchParams.set(\"longitude\", lon);",
    "  url.searchParams.set(\"current\", \"temperature_2m,weather_code\");",
    "  url.searchParams.set(\"daily\", \"temperature_2m_max,temperature_2m_min\");",
    "  url.searchParams.set(\"temperature_unit\", ctx.secrets.UNIT ?? \"fahrenheit\");",
    "  const res = await ctx.fetch(url, { signal: ctx.signal });",
    "  if (!res.ok) return ctx.emit({ status: \"error\", message: \"HTTP \" + res.status });",
    "  const data = await res.json();",
    "  ctx.emit({ status: \"live\", city, temp: Math.round(data.current.temperature_2m) });",
    "}"].join("\n"),
  "yahoo-finance": ["// yahoo-finance.js",
    "export const manifest = {",
    "  id: \"yahoo-finance\", version: \"0.4.1\", refresh: 15,",
    "  permissions: { network: [\"query1.finance.yahoo.com\"], secrets: [\"YAHOO_FINANCE_TOKEN\"] },",
    "  provides: [{ kind: \"stock\" }, { kind: \"stock/history\" }],",
    "};",
    "",
    "export async function run(ctx) {",
    "  const { ticker = \"AAPL\", range = \"1d\" } = ctx.widget.props;",
    "  const url = \"https://query1.finance.yahoo.com/v8/finance/chart/\" + ticker + \"?range=\" + range;",
    "  const res = await ctx.fetch(url, {",
    "    headers: { Authorization: \"Bearer \" + ctx.secrets.YAHOO_FINANCE_TOKEN },",
    "    signal: ctx.signal,",
    "  });",
    "  const json = await res.json();",
    "  const meta = json.chart.result[0].meta;",
    "  ctx.emit({ status: \"live\", ticker, name: meta.shortName, price: meta.regularMarketPrice });",
    "}"].join("\n"),
  "macos-calendar": ["// macos-calendar.js — Tauri-bridged",
    "export const manifest = {",
    "  id: \"macos-calendar\", version: \"native\", refresh: 300,",
    "  provides: [{ kind: \"calendar\" }],",
    "};",
    "",
    "export async function run(ctx) {",
    "  const events = await ctx.invoke(\"calendar.list_today\");",
    "  ctx.emit({ status: \"live\", events });",
    "}"].join("\n"),
  "google-calendar": ["// google-calendar.js",
    "export const manifest = {",
    "  id: \"google-calendar\", version: \"0.3.0\", refresh: 120,",
    "  permissions: { network: [\"www.googleapis.com\"], secrets: [\"GOOGLE_OAUTH_TOKEN\"] },",
    "  provides: [{ kind: \"calendar\" }],",
    "};",
    "",
    "export async function run(ctx) {",
    "  const res = await ctx.fetch(\"https://www.googleapis.com/calendar/v3/calendars/primary/events\", {",
    "    headers: { Authorization: \"Bearer \" + ctx.secrets.GOOGLE_OAUTH_TOKEN },",
    "    signal: ctx.signal,",
    "  });",
    "  const json = await res.json();",
    "  ctx.emit({ status: \"live\", events: json.items });",
    "}"].join("\n"),
  "reminders": ["// reminders.js — Tauri-bridged",
    "export const manifest = {",
    "  id: \"reminders\", version: \"native\", refresh: 60,",
    "  provides: [{ kind: \"todo\" }, { kind: \"calendar\" }],",
    "};",
    "",
    "export async function run(ctx) {",
    "  const items = await ctx.invoke(\"reminders.list_due\", { date: ctx.widget.props.date });",
    "  ctx.emit({ status: \"live\", items });",
    "}"].join("\n"),
};

function resolveSource(extensionId) {
  return EXTENSION_SOURCES[extensionId.split("/")[0]] || "// Source not available.";
}

function WidgetSourceSheet({ kind, symbol, title, spec, onClose }) {
  const [tab, setTab] = React.useState("glue");
  const [openExt, setOpenExt] = React.useState(null);

  const glue = WIDGET_GLUE[kind] || "// No glue available for this widget kind.";
  const extensions = WIDGET_EXTENSIONS[kind] || [];
  const specJson = JSON.stringify(spec || { kind, symbol, _note: "No spec captured" }, null, 2);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = () => {
    let text;
    if (tab === "glue") text = glue;
    else if (tab === "extensions") text = openExt ? resolveSource(openExt) : extensions.map(e => "// " + e.file + " · " + e.id).join("\n");
    else text = specJson;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="widget-source-overlay" onMouseDown={onClose}>
      <div className="widget-source-sheet" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <div className="widget-source-head">
          <div className="row" style={{ gap: 8, flex: 1, minWidth: 0 }}>
            <Icon name="code-2" size={16} color="var(--fg2)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>Widget source</div>
              <div style={{ fontSize: 11, color: "var(--fg2)", fontFamily: "var(--font-mono)" }}>
                {symbol ? "@" + symbol + " · " : ""}<span style={{ color: "var(--fg1)" }}>{title}</span> · kind: <span style={{ color: "var(--color-accent)" }}>{kind}</span>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-icon" onClick={copy} title="Copy"><Icon name="copy" size={14} color="var(--fg2)" /></button>
            <button className="btn btn-icon" onClick={onClose} title="Close (esc)"><Icon name="x" size={14} color="var(--fg2)" /></button>
          </div>
        </div>
        <div className="widget-source-tabs">
          <button className={"widget-source-tab " + (tab === "glue" ? "on" : "")} onClick={() => setTab("glue")}>
            <Icon name="layers" size={12} color={tab === "glue" ? "var(--color-accent)" : "var(--fg2)"} />
            Glue
          </button>
          <button className={"widget-source-tab " + (tab === "extensions" ? "on" : "")} onClick={() => setTab("extensions")}>
            <Icon name="puzzle" size={12} color={tab === "extensions" ? "var(--color-accent)" : "var(--fg2)"} />
            Extensions <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg3)" }}>{extensions.length}</span>
          </button>
          <button className={"widget-source-tab " + (tab === "spec" ? "on" : "")} onClick={() => setTab("spec")}>
            <Icon name="braces" size={12} color={tab === "spec" ? "var(--color-accent)" : "var(--fg2)"} />
            Live spec
          </button>
          <div style={{ flex: 1 }}></div>
          <div style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--font-mono)", paddingRight: 4 }}>
            {tab === "glue" ? "wires extensions to UI components" : tab === "extensions" ? "data sources used by the glue" : "what the runtime emitted"}
          </div>
        </div>
        {tab === "extensions" ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--stroke-hairline)", display: "flex", flexDirection: "column", gap: 4 }}>
              {extensions.map(ext => (
                <button key={ext.id} className={"widget-ext-row " + (openExt === ext.id ? "on" : "")} onClick={() => setOpenExt(openExt === ext.id ? null : ext.id)}>
                  <Icon name={ext.icon} size={14} color="var(--fg2)" />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg1)" }}>{ext.id}</div>
                    <div style={{ fontSize: 11, color: "var(--fg2)" }}>{ext.summary}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--font-mono)" }}>v{ext.version}</span>
                  <Icon name={openExt === ext.id ? "chevron-down" : "chevron-right"} size={14} color="var(--fg3)" />
                </button>
              ))}
            </div>
            {openExt ? (
              <pre className="widget-source-code" style={{ flex: 1, minHeight: 0 }}><code>{resolveSource(openExt)}</code></pre>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, color: "var(--fg3)", fontSize: 12, textAlign: "center" }}>Click an extension above to see its source.</div>
            )}
          </div>
        ) : (
          <pre className="widget-source-code"><code>{tab === "spec" ? specJson : glue}</code></pre>
        )}
        <div className="widget-source-foot">
          <span style={{ fontSize: 11, color: "var(--fg3)" }}>Source is read-only here. Edit in <strong style={{ color: "var(--fg1)" }}>Settings → Extensions</strong>.</span>
          <div style={{ flex: 1 }}></div>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          <Button variant="primary" size="sm" icon="external-link" onClick={onClose}>Open in editor</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Status pill ---------- */
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

/* ---------- Widget kinds ---------- */
function WeatherWidget({ city, temp, hi, lo, condition, ago, selected, onSelect, symbol, isNew, onDelete, onAddressInChat, onRetag }) {
  return (
    <WidgetShell kind="weather" sourceSpec={{ kind: "weather", symbol, props: { city }, status: "live", payload: { temp, hi, lo, condition } }} title={city} status={{ tone: "live", label: ago }} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle, #FFD60A 0%, #FF9F0A 100%)", boxShadow: "0 0 20px rgba(255,159,10,0.45)" }}></div>
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
    <WidgetShell kind="stock" sourceSpec={{ kind: "stock", symbol, props: { ticker }, status: "live", payload: { ticker, name, price, delta, pct } }} title={`${ticker} · ${name}`} status={{ tone: "live", label: "1 min" }} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
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
    <WidgetShell kind="calendar" sourceSpec={{ kind: "calendar", symbol, props: {}, status: "live", payload: { date, events } }} title={`Today · ${date}`} selected={selected} onSelect={onSelect} symbol={symbol} isNew={isNew} onDelete={onDelete} onAddressInChat={onAddressInChat} onRetag={onRetag}>
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
