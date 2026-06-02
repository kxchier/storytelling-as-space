import { useRef } from "react";

import UnifiedWorkspace from "./components/UnifiedWorkspace";
import { useProject } from "./hooks/useProject";

import "./App.css";

function App() {
  const fileInputRef = useRef(null);
  const {
    project,
    updatePassageText,
    updateSpacePassage,
    updateProjectTitle,
    updateSpace,
    makePassageExplorable,
    openSpaceEditor,
    addPassage,
    deletePassage,
    removeSpacePassage,
    saveProjectToFile,
    loadProjectFromFile,
    activeSpaceId,
    setActiveSpaceId,
    previewPassageId,
    selectPassageForPreview,
  } = useProject();

  async function handleLoadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadProjectFromFile(file);
    event.target.value = "";
  }

  return (
    <main className="app app-unified">
      <header className="app-header">
        <h1 className="app-title">Storytelling as Space</h1>

        <div className="app-header-controls">
          <input
            className="project-title-input"
            value={project.title}
            onChange={(event) => updateProjectTitle(event.target.value)}
            aria-label="Story title"
          />

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void saveProjectToFile();
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden-file-input"
            onChange={handleLoadFile}
          />
        </div>
      </header>

      <UnifiedWorkspace
        project={project}
        activeSpaceId={activeSpaceId}
        setActiveSpaceId={setActiveSpaceId}
        previewPassageId={previewPassageId}
        selectPassageForPreview={selectPassageForPreview}
        updatePassageText={updatePassageText}
        updateSpacePassage={updateSpacePassage}
        updateSpace={updateSpace}
        makePassageExplorable={makePassageExplorable}
        openSpaceEditor={openSpaceEditor}
        addPassage={addPassage}
        deletePassage={deletePassage}
        removeSpacePassage={removeSpacePassage}
      />
    </main>
  );
}

export default App;
