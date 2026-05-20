import {
  createInteractionAction,
  getDefaultInteractionsForCategory,
  getInteractionsForAsset,
} from "../utils/interactions";

function InteractionActionsEditor({
  assetName,
  category,
  interactions,
  onChange,
  disabled = false,
}) {
  const resolvedInteractions =
    interactions?.length > 0
      ? interactions
      : getInteractionsForAsset({ category, interactions: [] });

  function updateAction(actionId, field, value) {
    onChange(
      resolvedInteractions.map((action) =>
        action.id === actionId ? { ...action, [field]: value } : action
      )
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

  function resetToDefaults() {
    onChange(getDefaultInteractionsForCategory(category));
  }

  return (
    <div className="hitbox-group interaction-actions-editor">
      <p className="hitbox-group-title">Interaction actions</p>
      <p className="control-hint">
        These appear when the player walks near {assetName || "this object"}.
        Use {"{name}"} in the story line for the object name.
      </p>

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

            <button
              type="button"
              className="secondary-button interaction-remove-button"
              disabled={disabled || resolvedInteractions.length <= 1}
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
        <button
          type="button"
          className="secondary-button"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            resetToDefaults();
          }}
        >
          Reset defaults
        </button>
      </div>
    </div>
  );
}

export default InteractionActionsEditor;
