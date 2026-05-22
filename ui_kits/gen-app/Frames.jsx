/* DesktopFrame + IPhoneFrame — visual chrome for the two form factors. */

function DesktopFrame({ title = "gen-app", toolbarRight, children }) {
  return (
    <div className="mac-window">
      <div className="mac-toolbar">
        <div className="traffic">
          <div className="tl r"></div><div className="tl y"></div><div className="tl g"></div>
        </div>
        <div className="mac-title" style={{ marginLeft: 4 }}>{title}</div>
        <div className="right">{toolbarRight}</div>
      </div>
      <div className="mac-content">{children}</div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="ios-statusbar">
      <span className="time">9:41</span>
      <span className="right">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><path d="M1 7h1.5v3H1zM4 5h1.5v5H4zM7 3h1.5v7H7zM10 1h1.5v9H10zM13 0h1.5v10H13z"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1"><path d="M.5 5.5a7.5 7.5 0 0115 0M3 8a4.5 4.5 0 0110 0M5.5 10.5a2 2 0 014 0"/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" fill="none" stroke="currentColor"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor"/><rect x="21" y="4" width="1.5" height="3" rx="0.5" fill="currentColor"/></svg>
      </span>
    </div>
  );
}

function IPhoneFrame({ children, showStatusBar = true, showHomeIndicator = true, noNotch = false }) {
  return (
    <div className="iphone">
      <div className="iphone-screen">
        {!noNotch && <div className="iphone-notch"></div>}
        {showStatusBar && <StatusBar />}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
          {children}
        </div>
        {showHomeIndicator && <div className="ios-home-indicator"></div>}
      </div>
    </div>
  );
}

Object.assign(window, { DesktopFrame, IPhoneFrame, StatusBar });
