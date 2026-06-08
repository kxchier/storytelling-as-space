import { createInteractionAction } from "../utils/interactions";

function InteractionActionsEditor({
  assetName,
  interactions,
  onChange,
  disabled = false,
}) {
  const resolvedInteractions = interactions ?? [];

  function updateAction(actionId, field, value) {
    onChange(
      resolvedInteractions.map((action) => {
        if (action.id !== actionId) {
          if (field === "completesSpace" && value === true) {
            return { ...action, completesSpace: false };
          }
          return action;
        }
        return { ...action, [field]: value };
      })
    );
  }

  function removeAction(actionId) {
    onChange(resolvedInteractions.filter((action) => action.id !== actionId));
  }

  function addAction() {
    onChange([
      ...resolvedInteractions,
      createInteractionAction({
        label: "New cue",
        narrativeTemplate: `She interacted with the {name}.`,
      }),
    ]);
  }

  return (
    <div className="hitbox-group interaction-actions-editor">
      <p className="hitbox-group-title">Interaction cues</p>
      <p className="control-hint">
        These appear when the reader walks near {assetName || "this prop"}.
        Use {"{name}"} in the performance line for the prop name.
      </p>

      {resolvedInteractions.length === 0 ? (
        <p className="empty">No cues yet. Add one to make this prop interactive.</p>
      ) : (
        <div className="interaction-action-cards">
          {resolvedInteractions.map((action, index) => (
            <article key={action.id} className="interaction-action-card">
              <label className="control-hint">Cue {index + 1}</label>
              <input
                type="text"
                className="interaction-input"
                placeholder="Cue label, e.g. Open"
                value={action.label}
                disabled={disabled}
                onChange={(event) =>
                  updateAction(action.id, "label", event.target.value)
                }
                onClick={(event) => event.stopPropagation()}
              />

              <label className="control-hint">Performance line</label>
              <textarea
                className="interaction-input"
                placeholder="She opened the {name}."
                rows={2}
                value={action.narrativeTemplate}
                disabled={disabled}
                onChange={(event) =>
                  updateAction(action.id, "narrativeTemplate", event.target.value)
                }
                onClick={(event) => event.stopPropagation()}
              />

              <label className="cozy-checkbox-label completes-space-label">
                <input
                  type="checkbox"
                  checked={Boolean(action.completesSpace)}
                  disabled={disabled}
                  onChange={(event) =>
                    updateAction(action.id, "completesSpace", event.target.checked)
                  }
                  onClick={(event) => event.stopPropagation()}
                />
                Exit cue
              </label>

              <button
                type="button"
                className="secondary-button interaction-remove-button"
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  removeAction(action.id);
                }}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="interaction-editor-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            addAction();
          }}
        >
          Add cue
        </button>
      </div>
    </div>
  );
}

export default InteractionActionsEditor;
