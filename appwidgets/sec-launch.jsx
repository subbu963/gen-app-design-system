/* ============================================================
   Section E — Launch & discovery (Settings → Apps tab, delete)
   Section F — View-source sheet reshaped for app widgets
   Section G — Permission prompt (cross-extension first call)
   ============================================================ */

const { I, Anno, KindChip, RtChip, Pdot } = window;

/* ───────── E · Settings → Extensions → "Apps" tab ───────── */
function AppsTab() {
  const apps = [
    { icon: "kanban", color: "var(--color-accent)", name: "Kanban board", ext: "projects-board", desc: "Drag-and-drop board on a local sqlite store.", rt: "deno", kind: "app", running: true, tpl: 1 },
    { icon: "file-text", color: "var(--color-red)", name: "PDF viewer", ext: "pdf-tools", desc: "Read, search and outline PDFs. pdf.js inside a themed shell.", rt: "deno", kind: "bundled", running: false, tpl: 1 },
    { icon: "code-2", color: "var(--color-cyan)", name: "Code editor", ext: "code-tools", desc: "Monaco with language detection and a token-driven theme.", rt: "deno", kind: "bundled", running: false, tpl: 2 },
    { icon: "notebook-pen", color: "var(--color-purple)", name: "Notes", ext: "notes-app", desc: "Tagged, searchable notes. Two apps share one extension store.", rt: "deno", kind: "user", running: true, tpl: 0 },
  ];
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg-window)" }}>
      {/* tab header inside Settings → Extensions */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-4" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
        {["Installed", "Apps", "MCP servers"].map((t, i) => (
          <div key={t} className="text-[13px] pb-2 cursor-pointer relative" style={{ color: i === 1 ? "var(--fg1)" : "var(--fg2)", fontWeight: i === 1 ? 600 : 400 }}>
            {t}{i === 1 && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full" style={{ background: "var(--color-accent)" }}></span>}
          </div>
        ))}
        <span className="flex-1"></span>
        <span className="text-[10.5px] font-mono" style={{ color: "var(--fg3)" }}>4 apps · 2 extensions with apps[]</span>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5 overflow-hidden">
        {apps.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
            <span className="rounded-[9px] inline-flex items-center justify-center shrink-0" style={{ width: 34, height: 34, background: `color-mix(in oklab, ${a.color} 16%, transparent)`, border: `1px solid color-mix(in oklab, ${a.color} 38%, transparent)` }}>
              <I n={a.icon} c="" s={{ width: 17, height: 17, color: a.color }} />
            </span>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-fg1">{a.name}</span>
                <KindChip kind={a.kind} /><RtChip rt={a.rt} />
                {a.running && <Pdot state="running" />}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: "var(--bg-card-elevated)", color: "var(--fg3)" }}><I n="maximize" c="w-2.5 h-2.5" />full canvas</span>
                {a.tpl > 0 && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}><I n="layout-template" c="w-2.5 h-2.5" />{a.tpl} template{a.tpl > 1 ? "s" : ""}</span>}
              </div>
              <div className="text-[10.5px] text-fg2 leading-[1.45] truncate">{a.desc}</div>
              <div className="text-[9px] font-mono" style={{ color: "var(--fg3)" }}>{a.ext}</div>
            </div>
            <button className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white border-none cursor-pointer flex items-center gap-1.5 shrink-0" style={{ background: i === 0 ? "var(--color-accent)" : "transparent", color: i === 0 ? "white" : "var(--color-accent)", border: i === 0 ? "none" : "1px solid var(--color-accent)" }}>
              <I n="square-arrow-out-up-right" c="w-3 h-3" />{i === 0 ? "Open" : "Launch"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-auto px-5 py-3 flex items-start gap-2.5" style={{ borderTop: "1px solid var(--stroke-hairline)" }}>
        <I n="info" c="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
        <div className="text-[10.5px] text-fg2 leading-[1.5]"><span className="text-fg1 font-semibold">Launch</span> mounts the app on the active canvas. <span className="text-fg1 font-semibold">Open</span> promotes it to its own app tab in the strip — the same as the LLM's <code className="font-mono text-[10px]">attach_app_to_canvas</code>.</div>
      </div>
    </div>
  );
}

/* ───────── E · Delete app tab — two-stage confirm ───────── */
function DeleteAppTab() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6" style={{ background: "var(--bg-window)" }}>
      <div className="rounded-[18px] w-[340px] overflow-hidden" style={{ background: "var(--vibrancy-sheet)", backdropFilter: "var(--blur-thick)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)" }}>
        <div className="px-5 pt-5 pb-3 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "var(--tint-orange)" }}><I n="archive" c="w-6 h-6 text-orange" /></div>
          <div className="text-[15px] font-semibold text-fg1">Close the Workouts app?</div>
          <div className="text-[11.5px] text-fg2 leading-[1.5]">We'll archive this tab. Your data and the extension stay installed — reopen it any time from Settings.</div>
        </div>
        {/* second stage — optional uninstall, defaults to off */}
        <div className="mx-4 mb-3 rounded-[12px] p-3 flex items-start gap-2.5" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <div className="relative w-[36px] h-[20px] rounded-[10px] shrink-0 mt-0.5" style={{ background: "var(--fg4)" }}><div className="absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} /></div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[12px] text-fg1 font-semibold">Also uninstall the extension</div>
            <div className="text-[10px] text-fg2 leading-[1.45]">Deletes <code className="font-mono text-[9.5px]">workout-cal/</code> and its sqlite store and keychain secrets. This can't be undone.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pb-4">
          <button className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-full text-fg1 bg-transparent cursor-pointer" style={{ border: "1px solid var(--stroke-soft)" }}>Keep</button>
          <button className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-full text-white border-none cursor-pointer" style={{ background: "var(--color-orange)" }}>Close tab</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── F · View-source sheet reshaped for app widgets ───────── */
function ViewSourceSheet() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6" style={{ background: "var(--bg-window)" }}>
      <div className="rounded-[18px] w-[560px] h-[560px] flex flex-col overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
          <I n="code-2" c="w-4 h-4 text-accent" />
          <span className="text-[13px] font-semibold text-fg1">Source · @calendar</span>
          <KindChip kind="app" /><RtChip rt="deno" /><Pdot state="running" />
          <span className="flex-1"></span>
          <button className="w-6 h-6 rounded inline-flex items-center justify-center bg-transparent border-none cursor-pointer text-fg3"><I n="x" c="w-4 h-4" /></button>
        </div>
        {/* tabs — Glue omitted for app kind */}
        <div className="px-4 flex items-center gap-4" style={{ borderBottom: "1px solid var(--stroke-hairline)" }}>
          {[["Extension", true], ["Live spec", false], ["Permissions", false]].map(([t, on]) => (
            <div key={t} className="text-[12px] py-2.5 cursor-pointer relative" style={{ color: on ? "var(--fg1)" : "var(--fg2)", fontWeight: on ? 600 : 400 }}>
              {t}{on && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full" style={{ background: "var(--color-accent)" }}></span>}
            </div>
          ))}
          <span className="text-[10px] font-mono ml-1" style={{ color: "var(--fg4)" }}>· Glue n/a</span>
        </div>
        {/* Extension tab — file tree + read-only listing */}
        <div className="flex-1 min-h-0 flex">
          <div className="w-[180px] flex flex-col py-2" style={{ borderRight: "1px solid var(--stroke-hairline)", background: "rgba(255,255,255,0.012)" }}>
            <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-[0.06em]" style={{ color: "var(--fg4)" }}>workout-cal/</div>
            {[["manifest.json", "braces", true], ["index.ts", "file-code", false], ["deno.json", "braces", false], ["app/", "folder", false], ["app/index.html", "file-code", false], ["app/app.js", "file-code", false]].map(([f, ic, on], i) => (
              <div key={i} className="px-3 py-1 flex items-center gap-2 cursor-pointer" style={{ background: on ? "var(--bg-selected)" : "transparent", paddingLeft: f.startsWith("app/") && f !== "app/" ? 24 : 12 }}>
                <I n={ic} c={`w-3 h-3 ${on ? "text-accent" : "text-fg3"}`} /><span className="text-[10.5px] font-mono truncate" style={{ color: on ? "var(--fg1)" : "var(--fg2)" }}>{f.replace("app/", "")}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden p-3 font-mono text-[10.5px] leading-[1.7]" style={{ background: "var(--bg-window)" }}>
            <div style={{ color: "var(--fg3)" }}>{"{"}</div>
            <div style={{ paddingLeft: 14 }}><span style={{ color: "var(--color-cyan)" }}>"apps"</span>: [{"{"}</div>
            <div style={{ paddingLeft: 28 }}><span style={{ color: "var(--color-cyan)" }}>"id"</span>: <span style={{ color: "var(--color-green)" }}>"calendar"</span>,</div>
            <div style={{ paddingLeft: 28 }}><span style={{ color: "var(--color-cyan)" }}>"route"</span>: <span style={{ color: "var(--color-green)" }}>"/calendar"</span>,</div>
            <div style={{ paddingLeft: 28 }}><span style={{ color: "var(--color-cyan)" }}>"surface"</span>: <span style={{ color: "var(--color-green)" }}>"canvas"</span>,</div>
            <div style={{ paddingLeft: 28 }}><span style={{ color: "var(--color-cyan)" }}>"propSchema"</span>: {"{"} … {"}"}</div>
            <div style={{ paddingLeft: 14 }}>{"}"}],</div>
            <div style={{ paddingLeft: 14 }}><span style={{ color: "var(--color-cyan)" }}>"permissions"</span>: {"{"} <span style={{ color: "var(--color-cyan)" }}>"network"</span>: [] {"}"}</div>
            <div style={{ color: "var(--fg3)" }}>{"}"}</div>
            <div className="mt-2 px-2 py-1.5 rounded inline-flex items-center gap-1.5" style={{ background: "var(--bg-card)", color: "var(--fg3)", fontSize: 9.5 }}><I n="lock" c="w-2.5 h-2.5" />read-only — edit via Open in editor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── G · Permission prompt — first cross-extension call ───────── */
function PermissionPrompt() {
  return (
    <div className="w-full h-full flex items-end justify-center pb-8 relative" style={{ background: "var(--bg-window)" }}>
      {/* dimmed canvas hint behind */}
      <div className="absolute inset-0" style={{ ...window.dotGrid, opacity: 0.5 }}></div>
      <div className="absolute inset-0" style={{ background: "var(--bg-overlay)" }}></div>
      <div className="relative rounded-[18px] w-[380px] overflow-hidden" style={{ background: "var(--vibrancy-sheet)", backdropFilter: "var(--blur-thick)", border: "1px solid var(--stroke-soft)", boxShadow: "var(--elev-4)" }}>
        <div className="px-5 pt-5 pb-2 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] inline-flex items-center justify-center shrink-0" style={{ background: "var(--color-accent-tint)", border: "1px solid var(--color-accent)" }}><I n="kanban" c="w-5 h-5 text-accent" /></div>
            <I n="arrow-right" c="w-4 h-4 text-fg3" />
            <div className="w-10 h-10 rounded-[10px] inline-flex items-center justify-center shrink-0" style={{ background: "color-mix(in oklab, var(--color-green) 16%, transparent)", border: "1px solid color-mix(in oklab, var(--color-green) 40%, transparent)" }}><I n="cloud-sun" c="w-5 h-5 text-green" /></div>
          </div>
          <div className="text-[15px] font-semibold text-fg1 leading-[1.3]">Let <span className="text-accent">@board</span> ask <span className="text-green">weather</span> for data?</div>
          <div className="text-[11.5px] text-fg2 leading-[1.5]">Your projects board wants to call the weather extension's <code className="font-mono text-[10.5px]">current</code> provider. It runs server-side in that extension — your board never sees the key.</div>
        </div>
        {/* the specific grant */}
        <div className="mx-4 my-3 rounded-[12px] px-3 py-2.5 flex items-center gap-2 font-mono text-[10.5px]" style={{ background: "var(--bg-card)", border: "1px solid var(--stroke-soft)" }}>
          <I n="arrow-right-left" c="w-3 h-3 text-fg3" />
          <span className="text-accent">projects-board</span><span className="text-fg3">→</span><span className="text-green">weather</span><span className="text-fg3">·</span><span className="text-fg1">current</span>
        </div>
        <div className="px-4 pb-2 flex items-center gap-2 text-[10px]" style={{ color: "var(--fg3)" }}>
          <I n="info" c="w-3 h-3" />Stored on this widget. Tossing it releases the grant.
        </div>
        <div className="flex items-center gap-2 px-4 pb-4 pt-1">
          <button className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-full text-fg1 bg-transparent cursor-pointer" style={{ border: "1px solid var(--stroke-soft)" }}>Decline</button>
          <button className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-full text-white border-none cursor-pointer" style={{ background: "var(--color-accent)" }}>Allow</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppsTab, DeleteAppTab, ViewSourceSheet, PermissionPrompt });
