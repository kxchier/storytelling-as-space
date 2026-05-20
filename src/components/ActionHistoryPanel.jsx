function ActionHistoryPanel({
  actionHistory,
  livingNarrative,
  onClearHistory,
}) {
  return (
    <>
      <h2>Action History</h2>

      {actionHistory.length === 0 ? (
        <p className="empty">
          Walk near an object and choose an action. Each choice is recorded here.
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
            Clear action history
          </button>
        </>
      )}

      <h2 className="section-divider-heading">Living Story</h2>

      <div className="narrative-blank-card">
        <p className="narrative-blank-text">
          {livingNarrative || "Your story will grow here."}
        </p>
      </div>
    </>
  );
}

export default ActionHistoryPanel;
