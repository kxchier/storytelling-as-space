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
        label: "New action",
        narrativeTemplate: `She interacted with the {name}.`,
      }),
    ]);
  }

  return (
    <div className="hitbox-group interaction-actions-editor">
      <p className="hitbox-group-title">Interaction actions</p>
      <p className="control-hint">
        These appear when the player walks near {assetName || "this object"}.
        Use {"{name}"} in the story line for the object name.
      </p>

      {resolvedInteractions.length === 0 ? (
        <p className="empty">No actions yet. Add one to make this object interactive.</p>
      ) : (
        <div className="interaction-action-cards">
          {resolvedInteractions.map((action, index) => (
            <article key={action.id} className="interaction-action-card">
              <label className="control-hint">Action {index + 1}</label>
              <input
                type="text"
                className="interaction-input"
                placeholder="Button label, e.g. Open"
                value={action.label}
                disabled={disabled}
                onChange={(event) =>
                  updateAction(action.id, "label", event.target.value)
                }
                onClick={(event) => event.stopPropagation()}
              />

              <label className="control-hint">Story line</label>
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
                Completes space (win condition)
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
          Add action
        </button>
      </div>
    </div>
  );
}

export default InteractionActionsEditor;
