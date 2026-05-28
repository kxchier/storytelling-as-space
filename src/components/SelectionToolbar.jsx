function SelectionToolbar({
  position,
  canMakeExplorable,
  onMakeExplorable,
  onPreviewFromHere,
  onEditSpace,
  onRemoveSpace,
  isSpacePassage,
}) {
  if (!position) return null;

  return (
    <div
      className="selection-toolbar"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="Passage actions"
    >
      {isSpacePassage ? (
        <>
          <button type="button" onClick={onPreviewFromHere}>
            Preview from here
          </button>
          <button type="button" onClick={onEditSpace}>
            Edit space
          </button>
          <button type="button" className="secondary-button" onClick={onRemoveSpace}>
            Remove space
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={onPreviewFromHere}>
            Preview from here
          </button>
          {canMakeExplorable && (
            <button type="button" onClick={onMakeExplorable}>
              Make explorable
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default SelectionToolbar;
