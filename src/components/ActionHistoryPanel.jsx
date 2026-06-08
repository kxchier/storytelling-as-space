function ActionHistoryPanel({
  actionHistory,
  livingNarrative,
  onClearHistory,
}) {
  return (
    <>
      <h2>Performance history</h2>

      {actionHistory.length === 0 ? (
        <p className="empty">
          Walk near a prop and trigger a cue. Each performance line is recorded here.
        </p>
      ) : (
        <>
          <ol className="action-history-list">
            {actionHistory.map((entry) => (
              <li key={entry.id} className="action-history-item">
                <span className="action-history-label">
                  {entry.actionLabel} · {entry.assetName}
                </span>
                <p>{entry.narrativeLine}</p>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="secondary-button clear-history-button"
            onClick={onClearHistory}
          >
            Clear performance history
          </button>
        </>
      )}

      <h2 className="section-divider-heading">Rewritten scene preview</h2>

      <div className="narrative-blank-card">
        <p className="narrative-blank-text">
          {livingNarrative ||
            "Lead-in plus performance lines — the scene section is replaced on exit."}
        </p>
      </div>
    </>
  );
}

export default ActionHistoryPanel;
