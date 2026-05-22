/* Buttons + ListRow + Toggle + Segmented — Konsta-aligned primitives. */

function Button({ children, variant = "primary", size = "md", icon, iconAfter, onClick, disabled, type, className = "", style = {} }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={style}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === "sm" ? 14 : 16} /> : null}
    </button>
  );
}

function ListRow({ icon, iconBg, title, sub, right, onClick, selected }) {
  return (
    <div className="list-row" onClick={onClick}>
      {icon ? <div className="row-ic" style={{ background: iconBg || "var(--bg-card-elevated)" }}>{icon}</div> : null}
      <div className="row-body">
        <div className="row-title">{title}</div>
        {sub ? <div className="row-sub">{sub}</div> : null}
      </div>
      <div className="row-right">{right ?? (selected !== undefined
        ? <div className={`radio ${selected ? "on" : ""}`}></div>
        : <Icon name="chevron-right" size={16} />)}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? "on" : ""}`} onClick={() => onChange?.(!on)}></div>;
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(opt => (
        <div
          key={opt.value}
          className={`seg ${value === opt.value ? "on" : ""}`}
          onClick={() => onChange?.(opt.value)}
        >{opt.label}</div>
      ))}
    </div>
  );
}

Object.assign(window, { Button, ListRow, Toggle, Segmented });
