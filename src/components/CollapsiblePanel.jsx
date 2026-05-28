function CollapsiblePanel({
  title,
  expanded,
  onToggle,
  children,
  className = "",
  headerExtra = null,
}) {
  return (
    <section
      className={`collapsible-panel panel ${expanded ? "expanded" : "collapsed"} ${className}`.trim()}
    >
      <header className="collapsible-panel-header">
        <button
          type="button"
          className="collapsible-panel-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          <span className="collapsible-panel-chevron" aria-hidden>
            {expanded ? "▾" : "▸"}
          </span>
          <h2 className="collapsible-panel-title">{title}</h2>
        </button>
        {headerExtra}
      </header>
      {expanded && (
        <div className="collapsible-panel-body">{children}</div>
      )}
    </section>
  );
}

export default CollapsiblePanel;
