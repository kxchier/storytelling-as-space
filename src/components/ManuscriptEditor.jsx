import { useRef, useState } from "react";

import { getSpacePassageFields } from "../models/document";
import { getSpaceWinCondition } from "../utils/interactions";
import SelectionToolbar from "./SelectionToolbar";

function PassageActions({
  passageId,
  passageType,
  canDelete,
  onAddBelow,
  onDelete,
}) {
  return (
    <div className="manuscript-passage-actions">
      <button
        type="button"
        className="passage-gutter-button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onAddBelow("fixed", passageId)}
      >
        + Text below
      </button>
      <button
        type="button"
        className="passage-gutter-button"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onAddBelow("space", passageId)}
      >
        + Space below
      </button>
      <button
        type="button"
        className="passage-gutter-button manuscript-passage-delete"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onDelete(passageId)}
        disabled={!canDelete}
        aria-label={`Delete ${passageType === "space" ? "space" : "text"} section`}
      >
        Delete
      </button>
    </div>
  );
}

function ManuscriptEditor({
  project,
  onPassageTextChange,
  onSpacePassageChange,
  onMakeExplorable,
  onOpenSpace,
  onRemoveSpace,
  onAddPassage,
  onDeletePassage,
  previewPassageId = null,
  onSelectPassageForPreview,
}) {
  const [selectionState, setSelectionState] = useState(null);
  const manuscriptRef = useRef(null);
  const canDelete = project.passages.length > 1;

  function handleSelection(passageId, passageType) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !manuscriptRef.current) {
      setSelectionState(null);
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setSelectionState(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = manuscriptRef.current.getBoundingClientRect();

    setSelectionState({
      passageId,
      passageType,
      selectedText,
      top: rect.bottom - containerRect.top + manuscriptRef.current.scrollTop + 8,
      left: Math.max(8, rect.left - containerRect.left),
    });
  }

  function clearSelection() {
    setSelectionState(null);
    window.getSelection()?.removeAllRanges();
  }

  function selectPassage(passageId) {
    onSelectPassageForPreview?.(passageId);
  }

  function addBelow(type, afterPassageId) {
    onAddPassage?.(type, afterPassageId);
  }

  return (
    <div className="manuscript-editor" ref={manuscriptRef}>
      {project.passages.map((passage) => {
        const space = project.spaces[passage.id];
        const isSpace = passage.type === "space";
        const isSelected = passage.id === previewPassageId;
        const { sceneText } = getSpacePassageFields(passage);
        const winCondition = isSpace
          ? getSpaceWinCondition(space?.placedAssets ?? [])
          : null;

        if (isSpace) {
          return (
            <article
              key={passage.id}
              className={`manuscript-passage manuscript-passage-space ${
                isSelected ? "manuscript-passage-selected" : ""
              }`}
              onMouseDown={() => selectPassage(passage.id)}
              onMouseUp={() => handleSelection(passage.id, passage.type)}
            >
              <div className="manuscript-passage-space-top">
                <span className="manuscript-passage-kind">Isometric space</span>
                <div className="manuscript-passage-space-meta">
                  <span className="manuscript-space-title">
                    {space?.title ?? "Explorable space"}
                  </span>
                  <span className="manuscript-space-meta">
                    {space?.placedAssets?.length ?? 0} objects ·{" "}
                    {winCondition
                      ? `win: ${winCondition.actionLabel} · ${winCondition.assetName}`
                      : "no win set"}{" "}
                    · {space?.status ?? "draft"}
                  </span>
                </div>
                {isSelected && (
                  <button
                    type="button"
                    className="passage-gutter-button manuscript-passage-space-edit"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => onOpenSpace(passage.id)}
                  >
                    Edit space
                  </button>
                )}
              </div>

              <p className="manuscript-space-hint control-hint">
                Prose before this block is regular text above. This field is only
                what the reader steps into — replaced on exit by their actions.
              </p>

              <textarea
                className="manuscript-textarea manuscript-textarea-scene"
                value={sceneText}
                onFocus={() => selectPassage(passage.id)}
                onChange={(event) =>
                  onSpacePassageChange(passage.id, {
                    sceneText: event.target.value,
                  })
                }
                rows={5}
                placeholder="The seats were empty except for a forgotten scarf, a half-open suitcase..."
              />

              {isSelected && (
                <PassageActions
                  passageId={passage.id}
                  passageType={passage.type}
                  canDelete={canDelete}
                  onAddBelow={addBelow}
                  onDelete={onDeletePassage}
                />
              )}
            </article>
          );
        }

        return (
          <article
            key={passage.id}
            className={`manuscript-passage ${
              isSelected ? "manuscript-passage-selected" : ""
            }`}
            onMouseDown={() => selectPassage(passage.id)}
            onMouseUp={() => handleSelection(passage.id, passage.type)}
          >
            {isSelected && (
              <span className="manuscript-passage-kind">Text</span>
            )}
            <textarea
              className="manuscript-textarea"
              value={passage.text}
              onFocus={() => selectPassage(passage.id)}
              onChange={(event) =>
                onPassageTextChange(passage.id, event.target.value)
              }
              rows={5}
              placeholder="Write your story here..."
            />

            {isSelected && (
              <PassageActions
                passageId={passage.id}
                passageType={passage.type}
                canDelete={canDelete}
                onAddBelow={addBelow}
                onDelete={onDeletePassage}
              />
            )}
          </article>
        );
      })}

      <div className="manuscript-add-bar">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onAddPassage?.("fixed")}
        >
          Add text
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onAddPassage?.("space")}
        >
          Add isometric space
        </button>
      </div>

      <SelectionToolbar
        position={selectionState}
        canMakeExplorable={
          selectionState?.passageType === "fixed" &&
          Boolean(selectionState?.selectedText?.trim())
        }
        isSpacePassage={selectionState?.passageType === "space"}
        onMakeExplorable={() => {
          if (!selectionState) return;
          onMakeExplorable({
            passageId: selectionState.passageId,
            selectedText: selectionState.selectedText,
          });
          clearSelection();
        }}
        onPreviewFromHere={() => {
          if (!selectionState) return;
          selectPassage(selectionState.passageId);
          clearSelection();
        }}
        onEditSpace={() => {
          if (!selectionState) return;
          onOpenSpace(selectionState.passageId);
          clearSelection();
        }}
        onRemoveSpace={() => {
          if (!selectionState) return;
          onRemoveSpace(selectionState.passageId);
          clearSelection();
        }}
      />
    </div>
  );
}

export default ManuscriptEditor;
