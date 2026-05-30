/* ============================================================
   Section C — Canvas tab strip (canvas + app tabs) & + menu
   Section D — "New app" flow (splash → propose → mounted)
   ============================================================ */

const { I, Anno, MacBar, dotGrid, KanbanApp, RtChip, KindChip } = window;

/* App-extension icon swatch used inside app tabs. */
function ExtIcon({ icon, color, size = 18 }) {
  return (
    <span className="rounded-md inline-flex items-center justify-center shrink-0" style={{ width: size + 8, height: size + 8, background: `color-mix(in oklab, ${color} 18%, transparent)`, border: `1px solid color-mix(in oklab, ${color} 40%, transparent)` }}>
      <I n={icon} c="" s={{ width: size - 4, height: size - 4, color }} />
    </span>
  );
}

/* ───────── C · where do canvases live next to apps? ─────────
   Three structural answers. Canvases carry a grid glyph so they
   always read as canvases; apps carry their extension icon. */

function CanvasChip({ label, active }) {
  return (
    <div className="text-[12px] px-2.5 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5" style={{ background: active ? "var(--bg-card)" : "transparent", color: active ? "var(--fg1)" : "var(--fg2)", fontWeight: active ? 600 : 400, border: active ? "1px solid var(--stroke-soft)" : "1px solid transparent" }}>
      <I n="layout-grid" c="" s={{ width: 12, height: 12, color: active ? "var(--fg2)" : "var(--fg3)" }} />{label}
    </div>
  );
}
function AppChip({ icon, color, name, active }) {
  return (
    <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full cursor-pointer" style={{ background: active ? `color-mix(in oklab, ${color} 15%, transparent)` : "transparent", border: active ? `1px solid color-mix(in oklab, ${color} 45%, transparent)` : "1px solid transparent" }}>
      <AppGlyph icon={icon} color={color} size={20} />
      <span className="text-[12px]" style={{ color: active ? "var(--fg1)" : "var(--fg2)", fontWeight: active ? 600 : 400 }}>{name}</span>
      <span className="rounded-full" style={{ width: 6, height: 6, background: "var(--color-green)" }}></span>
    </div>
  );
}
/* Squircle app-icon — the “this is an app” signal (a dock/launchpad glyph). */
function AppGlyph({ icon, color, size = 20 }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: size * 0.32, background: `color-mix(in oklab, ${color} 28%, var(--bg-card))`, border: `1px solid color-mix(in oklab, ${color} 55%, transparent)`, boxShadow: `inset 0 1px 0 color-mix(in oklab, ${color} 35%, transparent)` }}>
      <I n={icon} c="" s={{ width: size * 0.56, height: size * 0.56, color }} />
    </span>
  );
}
function PlusBtn() {
  return <button className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-fg2 ml-0.5" style={{ border: "1px dashed var(--stroke-hairline)" }}><I n="plus" c="w-3.5 h-3.5" /></button>;
}
function ZoneLabel({ children }) {
  return <span className="text-[9px] font-mono uppercase tracking-[0.07em]" style={{ color: "var(--fg4)" }}>{children}</span>;
}

const APPS = [
  { icon: "dumbbell", color: "var(--color-green)", name: "Workouts" },
  { icon: "map", color: "var(--color-accent)", name: "Trip map" },
  { icon: "notebook-pen", color: "var(--color-purple)", name: "Notes" },
];

/* Option 1 — one lane, two labelled zones. Canvases anchored left. */
function StripZoned() {
  return (
    <div className="flex items-center gap-2">
      <ZoneLabel>canvases</ZoneLabel>
      <CanvasChip label="Planning" active />
      <CanvasChip label="Trading" />
      <PlusBtn />
      <div style={{ width: 1, height: 22, background: "var(--stroke-hairline)", margin: "0 6px" }}></div>
      <ZoneLabel>apps</ZoneLabel>
      {APPS.map((a, i) => <AppChip key={i} {...a} active={i === 0} />)}
      <PlusBtn />
    </div>
  );
}

/* Option 2 — strip holds canvases only; apps open from a launcher. */
function StripLauncher() {
  return (
    <div className="flex items-center gap-2 relative">
      <CanvasChip label="Planning" active />
      <CanvasChip label="Trading" />
      <PlusBtn />
      <div style={{ width: 1, height: 22, background: "var(--stroke-hairline)", margin: "0 6px" }}></div>
      {/* transient app tab — only while an app is open */}
      <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full" style={{ background: "color-mix(in oklab, var(--color-green) 16%, transparent)", border: "1px dashed color-mix(in oklab, var(--color-green) 55%, transparent)" }}>
        <ExtIcon icon="dumbbell" color="var(--color-green)" size={13} />
        <span className="text-[12px] font-semibold text-fg1">Workouts</span>
        <I n="x" c="w-3 h-3 text-fg3" />
      </div>
      {/* the launcher button */}
      <button className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full bg-transparent cursor-pointer" style={{ border: "1px solid var(--stroke-soft)" }}>
        <I n="layout-dashboard" c="w-3.5 h-3.5 text-accent" /><span className="text-[11.5px] font-semibold text-fg2">Apps</span><I n="chevron-down" c="w-3 h-3 text-fg3" />
      </button>
    </div>
  );
}

/* Option 3 — two stacked rows, each labelled. */
function StripRows() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0"><ZoneLabel>canvas</ZoneLabel></span>
        <CanvasChip label="Planning" active /><CanvasChip label="Trading" /><PlusBtn />
      </div>
      <div style={{ height: 1, background: "var(--stroke-hairline)" }}></div>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0"><ZoneLabel>apps</ZoneLabel></span>
        {APPS.map((a, i) => <AppChip key={i} {...a} active={i === 0} />)}
        <PlusBtn />
      </div>
    </div>
  );
}

/* Larger tab variants for the anatomy legend. */
function CanvasTabBig({ name, active }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full" style={{ background: active ? "var(--bg-card)" : "transparent", border: active ? "1px solid var(--stroke-soft)" : "1px solid transparent" }}>
      <I n="layout-grid" c="" s={{ width: 16, height: 16, color: active ? "var(--fg2)" : "var(--fg3)" }} />
      <span style={{ fontSize: 14, color: active ? "var(--fg1)" : "var(--fg2)", fontWeight: active ? 600 : 400 }}>{name}</span>
    </div>
  );
}
function AppTabBig({ icon, color, name, active }) {
  return (
    <div className="flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-full" style={{ background: active ? `color-mix(in oklab, ${color} 15%, transparent)` : "transparent", border: active ? `1px solid color-mix(in oklab, ${color} 45%, transparent)` : "1px solid transparent" }}>
      <AppGlyph icon={icon} color={color} size={26} />
      <span style={{ fontSize: 14, color: active ? "var(--fg1)" : "var(--fg2)", fontWeight: active ? 600 : 400 }}>{name}</span>
      <span className="rounded-full" style={{ width: 7, height: 7, background: "var(--color-green)" }}></span>
    </div>
  );
}

/* ───────── C · CHOSEN — one shared lane, told apart by shape ───────── */
function SharedLaneHero() {
  const Callout = ({ children }) => <li className="flex items-start gap-2 text-[11px] text-fg2 leading-[1.45]"><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: "var(--fg3)" }}></span><span>{children}</span></li>;
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6" style={{ background: "var(--bg-window)" }}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}>CHOSEN</span>
        <span className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Decision 7 · one lane — canvases are views, apps are programs</span>
      </div>

      {/* realistic title bar carrying the shared lane */}
      <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-2)" }}>
        <div className="mac-titlebar">
          <div className="mac-light r"></div><div className="mac-light y"></div><div className="mac-light g"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full" style={{ background: "var(--bg-window)" }}>
              <CanvasChip label="Planning" active />
              <CanvasChip label="Trading" />
              <div style={{ width: 1, height: 22, background: "var(--stroke-hairline)", margin: "0 5px" }}></div>
              {APPS.map((a, i) => <AppChip key={i} {...a} active={i === 0} />)}
              <PlusBtn />
            </div>
          </div>
          <div style={{ width: 42 }}></div>
        </div>
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "var(--bg-window)", borderTop: "1px solid var(--stroke-hairline)" }}>
          <I n="info" c="w-3 h-3 text-fg3" />
          <span className="text-[10px] text-fg3 leading-[1.4]">Same lane, no separate region needed — the <span className="text-fg2">shape</span> tells you which is which. Names always shown.</span>
        </div>
      </div>

      {/* anatomy legend */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="rounded-[12px] p-4 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <div className="flex items-center gap-2"><I n="layout-grid" c="w-3.5 h-3.5 text-fg2" /><span className="text-[12px] font-semibold text-fg1">Canvas tab</span><span className="text-[10px] text-fg3">— a view you arrange</span></div>
          <div className="flex"><CanvasTabBig name="Planning" active /></div>
          <ul className="flex flex-col gap-1.5 mt-0.5">
            <Callout><span className="text-fg1">Pill</span> shape · thin <span className="text-fg1">outline grid glyph</span> · neutral fill</Callout>
            <Callout>Holds a grid of live widgets — nothing of its own runs</Callout>
            <Callout>No process dot</Callout>
          </ul>
        </div>
        <div className="rounded-[12px] p-4 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <div className="flex items-center gap-2"><AppGlyph icon="dumbbell" color="var(--color-green)" size={16} /><span className="text-[12px] font-semibold text-fg1">App tab</span><span className="text-[10px] text-fg3">— a live program</span></div>
          <div className="flex"><AppTabBig icon="dumbbell" color="var(--color-green)" name="Workouts" active /></div>
          <ul className="flex flex-col gap-1.5 mt-0.5">
            <Callout><span className="text-fg1">Rounded-square app icon</span> in the extension's colour — the “this is an app” signal</Callout>
            <Callout><span className="text-fg1">Name</span> always beside the icon · accent-tinted when active</Callout>
            <Callout><span className="text-green">Green dot</span> = the extension subprocess is live</Callout>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ───────── C · lane overflow + recency ordering ───────── */
const MORE_APPS = [
  { icon: "notebook-pen", color: "var(--color-purple)", name: "Notes", when: "5m ago" },
  { icon: "kanban", color: "var(--color-accent)", name: "Projects", when: "1h ago" },
  { icon: "file-text", color: "var(--color-red)", name: "PDF viewer", when: "yesterday" },
];
function OverflowBtn({ count, open }) {
  return (
    <button className="flex items-center gap-1 pl-2 pr-2.5 py-1.5 rounded-full cursor-pointer" style={{ background: open ? "var(--color-accent-tint)" : "var(--bg-card)", border: `1px solid ${open ? "var(--color-accent)" : "var(--stroke-soft)"}` }}>
      <I n="chevron-down" c="" s={{ width: 13, height: 13, color: open ? "var(--color-accent)" : "var(--fg2)" }} />
      <span className="text-[11px] font-semibold" style={{ color: open ? "var(--color-accent)" : "var(--fg2)" }}>{count}</span>
    </button>
  );
}
function MiniApp({ icon, color, name, active }) {
  return (
    <div className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full" style={{ background: active ? `color-mix(in oklab, ${color} 15%, transparent)` : "transparent", border: active ? `1px solid color-mix(in oklab, ${color} 45%, transparent)` : "1px solid transparent" }}>
      <AppGlyph icon={icon} color={color} size={17} />
      <span className="text-[11px]" style={{ color: active ? "var(--fg1)" : "var(--fg2)", fontWeight: active ? 600 : 400 }}>{name}</span>
    </div>
  );
}

function LaneOverflow() {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Decision 7 · the lane is width-bound — only what fits stays inline, the rest fall into a ⌄ menu</div>

      {/* constrained title bar + open overflow dropdown */}
      <div className="relative">
        <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-2)" }}>
          <div className="mac-titlebar">
            <div className="mac-light r"></div><div className="mac-light y"></div><div className="mac-light g"></div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full" style={{ background: "var(--bg-window)" }}>
                <CanvasChip label="Planning" active />
                <CanvasChip label="Trading" />
                <div style={{ width: 1, height: 22, background: "var(--stroke-hairline)", margin: "0 5px" }}></div>
                <AppChip {...APPS[0]} active />
                <AppChip {...APPS[1]} />
                <OverflowBtn count={3} open />
                <PlusBtn />
              </div>
            </div>
            <div style={{ width: 42 }}></div>
          </div>
        </div>
        {/* dropdown, anchored under the ⌄ */}
        <div className="absolute rounded-[12px] py-1.5 w-[230px] z-10" style={{ top: 50, left: "58%", background: "var(--vibrancy-popover)", backdropFilter: "var(--blur-thin)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-3)" }}>
          <div className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
            <span className="text-[10px] font-semibold text-fg1">More apps</span>
            <span className="flex-1"></span>
            <span className="text-[9px] font-mono inline-flex items-center gap-1" style={{ color: "var(--fg3)" }}><I n="arrow-down-narrow-wide" c="w-2.5 h-2.5" />recent first</span>
          </div>
          {MORE_APPS.map((a, i) => (
            <div key={i} className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer">
              <AppGlyph icon={a.icon} color={a.color} size={20} />
              <span className="text-[12px] text-fg1 flex-1">{a.name}</span>
              <span className="text-[9px] font-mono" style={{ color: "var(--fg3)" }}>{a.when}</span>
            </div>
          ))}
        </div>
      </div>

      {/* recency ordering — before → after */}
      <div className="rounded-[12px] p-4 flex flex-col gap-3 mt-1" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
        <div className="flex items-center gap-2"><Anno>Recent stays first</Anno><span className="text-[10.5px] text-fg2">opening an app moves it to the front of the app zone</span></div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.05em]" style={{ color: "var(--fg4)" }}>before</span>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
              <MiniApp {...APPS[0]} active /><MiniApp {...APPS[1]} /><OverflowBtn count={3} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0 px-1">
            <I n="arrow-right" c="w-4 h-4 text-accent" />
            <span className="text-[8.5px] font-mono text-center leading-[1.25]" style={{ color: "var(--fg3)", width: 70 }}>open “PDF viewer” from ⌄</span>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.05em]" style={{ color: "var(--fg4)" }}>after</span>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
              <MiniApp icon="file-text" color="var(--color-red)" name="PDF viewer" active /><MiniApp {...APPS[0]} /><OverflowBtn count={3} />
            </div>
          </div>
        </div>
        <div className="text-[10.5px] text-fg2 leading-[1.5]">PDF viewer jumps to the front; Trip map slides into the ⌄ overflow. The set that fits never changes size — the lane just reshuffles by most-recently-used.</div>
      </div>
    </div>
  );
}

/* ───────── C · combined lane controls — ⌄ overflow + the + menu ───────── */
function LaneControls() {
  const Opt = ({ icon, title, sub, accent }) => (
    <div className="flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-[10px]">
      <div className="w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0" style={{ background: accent ? "var(--color-accent-tint)" : "var(--bg-card-elevated)" }}>
        <I n={icon} c={`w-4 h-4 ${accent ? "text-accent" : "text-fg2"}`} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[12.5px] font-semibold text-fg1">{title}</div>
        <div className="text-[10px] text-fg2 leading-[1.4]">{sub}</div>
      </div>
    </div>
  );
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Decision 7 · the lane's two controls — ⌄ overflow (what doesn't fit) · + (new canvas or app)</div>

      {/* one shared strip carrying both controls */}
      <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-2)" }}>
        <div className="mac-titlebar">
          <div className="mac-light r"></div><div className="mac-light y"></div><div className="mac-light g"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-full" style={{ background: "var(--bg-window)" }}>
              <CanvasChip label="Planning" active />
              <CanvasChip label="Trading" />
              <div style={{ width: 1, height: 22, background: "var(--stroke-hairline)", margin: "0 5px" }}></div>
              <AppChip {...APPS[0]} active />
              <AppChip {...APPS[1]} />
              <OverflowBtn count={3} open />
              <button className="w-7 h-7 rounded-full inline-flex items-center justify-center border-none cursor-pointer ml-0.5" style={{ background: "var(--color-accent)" }}><I n="plus" c="w-3.5 h-3.5 text-white" /></button>
            </div>
          </div>
          <div style={{ width: 42 }}></div>
        </div>
      </div>

      {/* the two controls, side by side */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* ⌄ overflow */}
        <div className="rounded-[12px] p-3.5 flex flex-col gap-2.5" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <div className="flex items-center gap-2"><OverflowBtn count={3} open /><span className="text-[12px] font-semibold text-fg1">Overflow</span><span className="text-[10px] text-fg3">— what doesn't fit the width</span></div>
          <div className="rounded-[10px] py-1" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
            <div className="px-2.5 py-1 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
              <span className="text-[9.5px] font-semibold text-fg2">More apps</span><span className="flex-1"></span><span className="text-[9px] font-mono inline-flex items-center gap-1" style={{ color: "var(--fg3)" }}><I n="arrow-down-narrow-wide" c="w-2.5 h-2.5" />recent first</span>
            </div>
            {MORE_APPS.map((a, i) => (
              <div key={i} className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer">
                <AppGlyph icon={a.icon} color={a.color} size={18} />
                <span className="text-[11.5px] text-fg1 flex-1">{a.name}</span>
                <span className="text-[9px] font-mono" style={{ color: "var(--fg3)" }}>{a.when}</span>
              </div>
            ))}
          </div>
          {/* compact recency before → after */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-full" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
              <MiniApp {...APPS[0]} active /><MiniApp {...APPS[1]} />
            </div>
            <I n="arrow-right" c="w-3.5 h-3.5 text-accent shrink-0" />
            <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-full" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
              <MiniApp icon="file-text" color="var(--color-red)" name="PDF viewer" active /><MiniApp {...APPS[0]} />
            </div>
          </div>
          <div className="text-[10px] text-fg2 leading-[1.45]">Opening an app moves it to the front; the oldest slides into ⌄. Most-recent always sits first.</div>
        </div>

        {/* + new */}
        <div className="rounded-[12px] p-3.5 flex flex-col gap-2.5" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent)" }}><I n="plus" c="w-3.5 h-3.5 text-white" /></span><span className="text-[12px] font-semibold text-fg1">New</span><span className="text-[10px] text-fg3">— add to the lane</span></div>
          <div className="rounded-[10px] py-1" style={{ background: "var(--bg-window)", border: "1px solid var(--stroke-hairline)" }}>
            <Opt icon="layout-grid" title="New canvas" sub="A blank grid for live widgets — today's flow." />
            <div style={{ height: 1, background: "var(--stroke-hairline)", margin: "2px 10px" }}></div>
            <Opt icon="sparkles" title="New app" sub="Describe a tool; gen-app builds it as an extension you keep." accent />
          </div>
          <div className="text-[10px] text-fg2 leading-[1.45] mt-auto">Both land in the same lane — a canvas as a grid-glyph pill, an app as a coloured app-icon tab.</div>
        </div>
      </div>
    </div>
  );
}

function TabStripBoard() {
  const Row = ({ n, title, lives, note, children, tall }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2"><Anno>Option {n}</Anno><span className="text-[11px] text-fg2">{title}</span></div>
      <div className="rounded-[10px] px-3 flex items-center" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-hairline)", minHeight: tall ? 78 : 52 }}>{children}</div>
      <div className="text-[10.5px] leading-[1.5] max-w-[600px]"><span className="text-accent font-semibold">Canvases live: </span><span className="text-fg1">{lives}</span> <span className="text-fg2">— {note}</span></div>
    </div>
  );
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6" style={{ background: "var(--bg-window)" }}>
      <div className="text-[10px] text-fg3 font-mono uppercase tracking-[0.06em]">Alternatives considered · other ways to seat canvases & apps</div>
      <Row n={1} title="One lane, two labelled zones" lives="anchored left, always labelled" note="canvases sit first behind a “canvases” label; a divider then the “apps” zone. Both kinds stay visible side by side; grid glyph vs extension icon does the rest.">
        <StripZoned />
      </Row>
      <Row n={2} title="Canvases own the strip · apps launch in" lives="the whole strip — apps aren't permanent tabs" note="the strip is canvases only. An “Apps” launcher opens a picker; the active app shows as a dashed transient tab and closing it returns you to the grid. Matches “an app takes over the canvas”.">
        <StripLauncher />
      </Row>
      <Row n={3} title="Two stacked rows" lives="their own top row, above apps" tall note="canvases get a dedicated row, apps a second row beneath. Strongest separation; best when both kinds are numerous. Costs a little vertical space in the title bar.">
        <StripRows />
      </Row>
    </div>
  );
}

/* ───────── C · the + menu ───────── */
function PlusMenuBoard() {
  const Opt = ({ icon, title, sub, accent }) => (
    <div className="flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-[10px]" style={{ background: "transparent" }}>
      <div className="w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0" style={{ background: accent ? "var(--color-accent-tint)" : "var(--bg-card-elevated)" }}>
        <I n={icon} c={`w-4 h-4 ${accent ? "text-accent" : "text-fg2"}`} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[13px] font-semibold text-fg1">{title}</div>
        <div className="text-[10.5px] text-fg2 leading-[1.45]">{sub}</div>
      </div>
    </div>
  );
  return (
    <div className="w-full h-full flex items-start justify-center pt-10" style={{ background: "var(--bg-window)" }}>
      {/* the strip with the + active */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <span className="text-[12px] px-3 py-1.5 rounded-full text-fg1 font-semibold" style={{ background: "var(--bg-card-elevated)" }}>Planning</span>
          <span className="text-[12px] px-3 py-1.5 text-fg2">Trading</span>
          <span className="w-7 h-7 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}><I n="dumbbell" c="w-3.5 h-3.5 text-accent" /></span>
          <button className="w-7 h-7 rounded-full inline-flex items-center justify-center border-none cursor-pointer" style={{ background: "var(--color-accent)" }}><I n="plus" c="w-3.5 h-3.5 text-white" /></button>
        </div>
        {/* the menu */}
        <div className="rounded-[14px] py-1.5 w-[280px]" style={{ background: "var(--vibrancy-popover)", backdropFilter: "var(--blur-thin)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-3)" }}>
          <Opt icon="layout-grid" title="New canvas" sub="A blank grid for live widgets — today's flow." />
          <div style={{ height: 1, background: "var(--stroke-hairline)", margin: "2px 12px" }}></div>
          <Opt icon="sparkles" title="New app" sub="Describe a tool and gen-app builds it as an extension you keep." accent />
        </div>
      </div>
    </div>
  );
}

/* ───────── D · New-app flow, three stages ───────── */
function ChatDock({ children, w = 300, label = "New app" }) {
  return (
    <div className="flex flex-col" style={{ position: "absolute", right: 18, bottom: 18, width: w, background: "var(--vibrancy-dock)", backdropFilter: "var(--blur-regular)", border: "1px solid var(--stroke-soft)", borderRadius: 16, boxShadow: "var(--elev-4)" }}>
      <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        <div className="w-5 h-5 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent)" }}><I n="sparkles" c="w-3 h-3 text-white" /></div>
        <div className="text-[12.5px] font-semibold text-fg1">Chat</div><span className="text-[12px] text-fg2">· {label}</span>
        <span className="flex-1"></span><I n="chevron-down" c="w-3.5 h-3.5 text-fg3" />
      </div>
      <div className="px-3.5 py-3 flex flex-col gap-2.5">{children}</div>
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "var(--bg-input)", border: "1px solid var(--stroke-soft)" }}>
          <span className="text-[11.5px] text-fg3 flex-1">Describe your app…</span>
          <button className="w-6 h-6 rounded-full inline-flex items-center justify-center border-none cursor-pointer" style={{ background: "var(--color-accent)" }}><I n="arrow-up" c="w-3.5 h-3.5 text-white" /></button>
        </div>
      </div>
    </div>
  );
}
function Bubble({ who = "you", children }) {
  return <div className="flex flex-col gap-1"><div className="text-[10px] font-mono text-fg3">{who}</div><div className="text-[11.5px] text-fg1 leading-[1.5]">{children}</div></div>;
}

function NewAppSplash() {
  return (
    <div className="w-full h-full p-3" style={{ background: "var(--bg-base)" }}>
      <div className="mac-window w-full h-full flex flex-col">
        <MacBar>
          <div className="absolute left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--color-accent)" }}>
              <I n="sparkles" c="w-3 h-3 text-accent" /><span className="text-[11.5px] font-semibold text-accent">Untitled app</span>
            </div>
          </div>
        </MacBar>
        <div className="flex-1 min-h-0 relative" style={dotGrid}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-[20px] inline-flex items-center justify-center" style={{ background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}><I n="sparkles" c="w-8 h-8 text-accent" /></div>
            <div className="brand-display text-[34px]" style={{ color: "var(--fg1)", lineHeight: 1.1 }}>What do you want to build?</div>
            <div className="text-[13px] text-fg2 leading-[1.55] max-w-[420px]">Describe a tool you'll keep — a tracker, a board, a viewer. gen-app writes it as an extension, then mounts it right here. ↓</div>
            <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
              {["A kanban for my projects", "A notes app with tags", "A PDF reader"].map(s => (
                <span key={s} className="text-[11.5px] px-3 py-1.5 rounded-full cursor-pointer" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)", color: "var(--fg2)" }}>{s}</span>
              ))}
            </div>
          </div>
          <ChatDock><Bubble>{""}</Bubble></ChatDock>
        </div>
      </div>
    </div>
  );
}

function NewAppProposing() {
  return (
    <div className="w-full h-full p-3" style={{ background: "var(--bg-base)" }}>
      <div className="mac-window w-full h-full flex flex-col">
        <MacBar>
          <div className="absolute left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--color-accent)" }}>
              <span className="pdot running"></span><span className="text-[11.5px] font-semibold text-fg1">Projects board</span>
            </div>
          </div>
        </MacBar>
        <div className="flex-1 min-h-0 relative" style={dotGrid}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[11.5px] text-fg3 font-mono flex items-center gap-2"><span className="pdot running"></span>Building extension…</div>
          </div>
          <ChatDock w={340} label="Projects board">
            <Bubble>build me a kanban board for my projects</Bubble>
            <Bubble who="gen-app">On it — drafting a deno extension with a board app and a sqlite store.</Bubble>
            {/* propose_extension_change card */}
            <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid var(--stroke-soft)" }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--bg-card-elevated)" }}>
                <I n="folder-plus" c="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-mono text-fg1 flex-1">projects-board/</span>
                <KindChip kind="app" /><RtChip rt="deno" />
              </div>
              <div className="px-2.5 py-2 flex flex-col gap-1">
                {[["manifest.json", "apps[1] · templates[1]", "new"], ["index.ts", "Deno.serve · SPA", "new"], ["board.sql", "schema", "new"]].map(([f, d, k]) => (
                  <div key={f} className="flex items-center gap-2 px-1 py-0.5">
                    <I n="file-code" c="w-3 h-3 text-green" /><span className="text-[10.5px] font-mono text-fg1 flex-1">{f}</span>
                    <span className="text-[9px] font-mono text-fg3">{d}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(48,209,88,0.14)", color: "var(--color-green)" }}>{k}</span>
                  </div>
                ))}
              </div>
              <div className="px-2.5 py-1.5 flex items-center gap-2" style={{ background: "rgba(255,159,10,0.08)", borderTop: "1px solid var(--stroke-hairline)" }}>
                <I n="triangle-alert" c="w-3 h-3 text-orange shrink-0" /><span className="text-[9.5px] text-orange leading-[1.4]">2 lint notes · raw hex in header — apply anyway?</span>
              </div>
              <div className="flex items-center gap-1 p-2" style={{ borderTop: "1px solid var(--stroke-hairline)", background: "var(--bg-card)" }}>
                <button className="text-[10.5px] font-semibold py-1 px-2 rounded-full text-fg2 bg-transparent cursor-pointer flex items-center gap-1" style={{ border: "1px solid var(--stroke-soft)" }}><I n="eye" c="w-3 h-3" />Preview</button>
                <span className="flex-1"></span>
                <button className="text-[10.5px] font-semibold py-1 px-2 rounded-full text-fg3 bg-transparent cursor-pointer">Reject</button>
                <button className="text-[10.5px] font-semibold py-1 px-2.5 rounded-full text-white border-none cursor-pointer" style={{ background: "var(--color-accent)" }}>Apply</button>
              </div>
            </div>
          </ChatDock>
        </div>
      </div>
    </div>
  );
}

function NewAppMounted() {
  return (
    <div className="w-full h-full p-3" style={{ background: "var(--bg-base)" }}>
      <div className="mac-window w-full h-full flex flex-col">
        <MacBar>
          <div className="absolute left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-auto" style={{ background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}>
              <I n="kanban" c="w-3.5 h-3.5 text-accent" /><span className="text-[11.5px] font-semibold text-fg1">Projects board</span>
            </div>
          </div>
        </MacBar>
        <div className="flex-1 min-h-0 relative" style={{ background: "var(--bg-window)" }}>
          <div className="absolute inset-0"><KanbanApp /></div>
          <button className="absolute z-10 flex items-center gap-2 pl-2.5 pr-3.5 py-2.5 rounded-full border-none cursor-pointer" style={{ right: 18, bottom: 18, background: "var(--vibrancy-dock)", backdropFilter: "var(--blur-regular)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)" }}>
            <div className="w-6 h-6 rounded-full inline-flex items-center justify-center" style={{ background: "var(--color-accent)" }}><I n="sparkles" c="w-3.5 h-3.5 text-white" /></div>
            <span className="text-[12px] font-semibold text-fg1">Iterate</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SharedLaneHero, LaneOverflow, LaneControls, TabStripBoard, PlusMenuBoard, NewAppSplash, NewAppProposing, NewAppMounted, ChatDock, Bubble });
