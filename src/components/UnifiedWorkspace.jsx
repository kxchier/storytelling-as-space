import { useEffect, useMemo, useState } from "react";

import CollapsiblePanel from "./CollapsiblePanel";
import WorkspaceSplit from "./WorkspaceSplit";
import ManuscriptEditor from "./ManuscriptEditor";
import SpaceAuthoringLayout from "./SpaceAuthoringLayout";
import PreviewReader from "./PreviewReader";
import {
  createEmptySpace,
  getPassageById,
  getSpacePassageFields,
  getSpacePassages,
} from "../models/document";

function UnifiedWorkspace({
  project,
  activeSpaceId,
  setActiveSpaceId,
  previewPassageId,
  selectPassageForPreview,
  updatePassageText,
  updateSpacePassage,
  updateSpace,
  makePassageExplorable,
  openSpaceEditor,
  addPassage,
  deletePassage,
  removeSpacePassage,
}) {
  const [panels, setPanels] = useState({
    write: true,
    preview: true,
    space: true,
  });

  const spacePassages = useMemo(() => getSpacePassages(project), [project]);

  useEffect(() => {
    if (activeSpaceId) return;
    const firstSpace = spacePassages[0];
    if (firstSpace) {
      setActiveSpaceId(firstSpace.id);
    }
  }, [activeSpaceId, spacePassages, setActiveSpaceId]);

  const activeSpacePassage = activeSpaceId
    ? getPassageById(project, activeSpaceId)
    : null;

  const activeSpace =
    activeSpacePassage?.type === "space"
      ? project.spaces[activeSpaceId] ??
        createEmptySpace(activeSpaceId, {
          sceneText: getSpacePassageFields(activeSpacePassage).sceneText,
        })
      : null;

  function togglePanel(name) {
    setPanels((previous) => ({ ...previous, [name]: !previous[name] }));
  }

  function handleMakeExplorable({ passageId, selectedText }) {
    const title = selectedText.split(/\s+/).slice(0, 4).join(" ");
    makePassageExplorable({
      passageId,
      selectedText,
      title: title || "Untitled vignette",
    });
  }

  function handleOpenSpace(passageId) {
    openSpaceEditor(passageId);
    setPanels((previous) => ({ ...previous, space: true }));
  }

  function handleSelectSpace(passageId) {
    setActiveSpaceId(passageId);
    selectPassageForPreview(passageId);
  }

  const spaceSelector =
    spacePassages.length > 0 ? (
      <select
        className="space-passage-select"
        value={activeSpaceId ?? ""}
        onChange={(event) => handleSelectSpace(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        aria-label="Active vignette"
      >
        {spacePassages.map((passage) => {
          const space = project.spaces[passage.id];
          return (
            <option key={passage.id} value={passage.id}>
              {space?.title ?? "Untitled vignette"}
            </option>
          );
        })}
      </select>
    ) : null;

  const leftColumn = (
    <div className="unified-left">
      <CollapsiblePanel
        title="Write"
        expanded={panels.write}
        onToggle={() => togglePanel("write")}
        className="unified-write-panel"
      >
        <ManuscriptEditor
          project={project}
          onPassageTextChange={updatePassageText}
          onSpacePassageChange={updateSpacePassage}
          onMakeExplorable={handleMakeExplorable}
          onOpenSpace={handleOpenSpace}
          onAddPassage={addPassage}
          onDeletePassage={deletePassage}
          onRemoveSpace={removeSpacePassage}
          previewPassageId={previewPassageId}
          onSelectPassageForPreview={selectPassageForPreview}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Preview"
        expanded={panels.preview}
        onToggle={() => togglePanel("preview")}
        className="unified-preview-panel"
      >
        <PreviewReader
          project={project}
          embedded
          focusPassageId={previewPassageId}
          onExploringSpaceChange={(passageId) => {
            if (passageId) setActiveSpaceId(passageId);
          }}
        />
      </CollapsiblePanel>
    </div>
  );

  const rightColumn = (
    <CollapsiblePanel
      title="Scenography"
      expanded={panels.space}
      onToggle={() => togglePanel("space")}
      className="unified-space-panel"
      headerExtra={spaceSelector}
    >
      {activeSpacePassage?.type === "space" && activeSpace ? (
        <SpaceAuthoringLayout
          embedded
          passage={activeSpacePassage}
          space={activeSpace}
          onSpacePassageChange={updateSpacePassage}
          onSpaceUpdate={updateSpace}
        />
      ) : (
        <p className="empty unified-space-empty">
          Select text and choose &ldquo;Stage passage,&rdquo; or pick a vignette from
          the dropdown.
        </p>
      )}
    </CollapsiblePanel>
  );

  return (
    <div className="unified-workspace">
      <WorkspaceSplit left={leftColumn} right={rightColumn} />
    </div>
  );
}

export default UnifiedWorkspace;
