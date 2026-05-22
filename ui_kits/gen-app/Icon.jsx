/* Icon — wrapper for Lucide. Each icon is fetched once and cached. */
function Icon({ name, size = 18, color, className = "", style = {} }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      ref.current.appendChild(i);
      window.lucide.createIcons({ icons: window.lucide.icons, attrs: { class: "lc" } });
      // size override
      const svg = ref.current.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        if (color) svg.setAttribute("stroke", color);
      }
    }
  }, [name, size, color]);
  return <span ref={ref} className={`icon ${className}`} style={{ display: "inline-flex", lineHeight: 0, ...style }} />;
}

window.Icon = Icon;
