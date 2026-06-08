function InteractionOverlay({ asset, actions, onPerformAction }) {
  if (!asset || actions.length === 0) {
    return null;
  }

  return (
    <div className="interaction-overlay">
      <span className="interaction-overlay-title">Near {asset.name}</span>
      <div className="interaction-action-list" role="group" aria-label="Interaction cues">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="interaction-action-button"
            onClick={() => onPerformAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default InteractionOverlay;
