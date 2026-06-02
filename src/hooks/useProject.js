import { useCallback, useState } from "react";

import {
  createEmptyProject,
  createFixedPassage,
  createId,
  createSpacePassageEntry,
  deserializeProject,
  getSpaceForPassage,
  getSpacePassageFields,
  normalizePassage,
  serializeProject,
  splitSelectionIntoSpaceParts,
} from "../models/document";
import { embedImagesInProject } from "../utils/projectImages";

function getFirstSpaceId(project) {
  return project.passages.find((passage) => passage.type === "space")?.id ?? null;
}

function getDefaultPreviewPassageId(project) {
  return getFirstSpaceId(project) ?? project.passages[0]?.id ?? null;
}

export function useProject(initialProject = createEmptyProject()) {
  const [project, setProject] = useState(initialProject);
  const [activeSpaceId, setActiveSpaceId] = useState(() =>
    getFirstSpaceId(initialProject)
  );
  const [previewPassageId, setPreviewPassageId] = useState(() =>
    getDefaultPreviewPassageId(initialProject)
  );

  const updateProject = useCallback((updater) => {
    setProject((previous) =>
      typeof updater === "function" ? updater(previous) : updater
    );
  }, []);

  const updatePassageText = useCallback((passageId, text) => {
    setProject((previous) => {
      const passage = previous.passages.find((item) => item.id === passageId);
      if (!passage) return previous;

      if (passage.type === "space") {
        return updateSpacePassageInProject(previous, passageId, {
          sceneText: text,
        });
      }

      return {
        ...previous,
        passages: previous.passages.map((item) =>
          item.id === passageId ? { ...item, text } : item
        ),
      };
    });
  }, []);

  const updateSpacePassage = useCallback((passageId, { leadIn, sceneText }) => {
    setProject((previous) =>
      updateSpacePassageInProject(previous, passageId, { leadIn, sceneText })
    );
  }, []);

  const updateProjectTitle = useCallback((title) => {
    setProject((previous) => ({ ...previous, title }));
  }, []);

  const updateSpace = useCallback((passageId, updates) => {
    setProject((previous) => {
      const existing = previous.spaces[passageId] ?? createEmptySpace(passageId);
      return {
        ...previous,
        spaces: {
          ...previous.spaces,
          [passageId]: { ...existing, ...updates },
        },
      };
    });
  }, []);

  const makePassageExplorable = useCallback(
    ({ passageId, selectedText, title }) => {
      let createdSpaceId = null;

      setProject((previous) => {
        const passageIndex = previous.passages.findIndex(
          (item) => item.id === passageId
        );
        if (passageIndex === -1) return previous;

        const passage = previous.passages[passageIndex];
        if (passage.type === "space") return previous;

        const trimmedSelection = selectedText?.trim();
        if (!trimmedSelection) return previous;

        const fullText = passage.text;
        const start = fullText.indexOf(selectedText);
        if (start === -1) return previous;

        const end = start + selectedText.length;
        const before = fullText.slice(0, start).trim();
        const after = fullText.slice(end).trim();

        const { leadIn: selectionLeadIn, sceneText } =
          splitSelectionIntoSpaceParts(trimmedSelection);

        const spaceId = createId();
        createdSpaceId = spaceId;
        const newPassages = [];

        const fixedBefore = [before, selectionLeadIn].filter(Boolean).join("\n\n");
        if (fixedBefore) {
          newPassages.push({
            id: createId(),
            type: "fixed",
            text: fixedBefore,
          });
        }

        newPassages.push(
          normalizePassage({
            id: spaceId,
            type: "space",
            leadIn: "",
            sceneText,
          })
        );

        if (after) {
          newPassages.push({
            id: createId(),
            type: "fixed",
            text: after,
          });
        }

        const nextPassages = [
          ...previous.passages.slice(0, passageIndex),
          ...newPassages,
          ...previous.passages.slice(passageIndex + 1),
        ];

        return {
          ...previous,
          passages: nextPassages,
          spaces: {
            ...previous.spaces,
            [spaceId]: createEmptySpace(spaceId, {
              title: title || "Explorable space",
              sceneText,
            }),
          },
        };
      });

      if (createdSpaceId) {
        setActiveSpaceId(createdSpaceId);
        setPreviewPassageId(createdSpaceId);
      }
    },
    []
  );

  const openSpaceEditor = useCallback((passageId) => {
    setProject((previous) => {
      const passage = previous.passages.find((item) => item.id === passageId);
      if (!passage || passage.type !== "space") return previous;
      if (previous.spaces[passageId]) return previous;

      const { sceneText } = getSpacePassageFields(passage);
      return {
        ...previous,
        spaces: {
          ...previous.spaces,
          [passageId]: createEmptySpace(passageId, {
            title: "Explorable space",
            sceneText,
          }),
        },
      };
    });
    setActiveSpaceId(passageId);
    setPreviewPassageId(passageId);
  }, []);

  const selectPassageForPreview = useCallback(
    (passageId) => {
      setPreviewPassageId(passageId);
      const passage = project.passages.find((item) => item.id === passageId);
      if (passage?.type === "space") {
        setActiveSpaceId(passageId);
      }
    },
    [project.passages]
  );

  const addPassage = useCallback((type, afterPassageId = null) => {
    let newPassageId = null;

    setProject((previous) => {
      let insertIndex = previous.passages.length;
      if (afterPassageId) {
        const afterIndex = previous.passages.findIndex(
          (item) => item.id === afterPassageId
        );
        if (afterIndex >= 0) insertIndex = afterIndex + 1;
      }

      if (type === "fixed") {
        const passage = createFixedPassage();
        newPassageId = passage.id;
        const passages = [
          ...previous.passages.slice(0, insertIndex),
          passage,
          ...previous.passages.slice(insertIndex),
        ];
        return { ...previous, passages };
      }

      const { passage, space } = createSpacePassageEntry();
      newPassageId = passage.id;
      const passages = [
        ...previous.passages.slice(0, insertIndex),
        passage,
        ...previous.passages.slice(insertIndex),
      ];

      return {
        ...previous,
        passages,
        spaces: {
          ...previous.spaces,
          [passage.id]: space,
        },
      };
    });

    if (newPassageId) {
      setPreviewPassageId(newPassageId);
      if (type === "space") {
        setActiveSpaceId(newPassageId);
      }
    }
  }, []);

  const deletePassage = useCallback((passageId) => {
    setProject((previous) => {
      if (previous.passages.length <= 1) return previous;

      const passage = previous.passages.find((item) => item.id === passageId);
      if (!passage) return previous;

      const passages = previous.passages.filter((item) => item.id !== passageId);
      let spaces = previous.spaces;

      if (passage.type === "space") {
        const { [passageId]: _removed, ...remainingSpaces } = previous.spaces;
        spaces = remainingSpaces;
      }

      const nextProject = { ...previous, passages, spaces };

      setActiveSpaceId((current) =>
        current === passageId ? getFirstSpaceId(nextProject) : current
      );
      setPreviewPassageId((current) => {
        if (current !== passageId) return current;
        const deletedIndex = previous.passages.findIndex(
          (item) => item.id === passageId
        );
        const fallback =
          passages[deletedIndex] ?? passages[deletedIndex - 1] ?? passages[0];
        return fallback?.id ?? null;
      });

      return nextProject;
    });
  }, []);

  const removeSpacePassage = useCallback((passageId) => {
    setProject((previous) => {
      const passage = previous.passages.find((item) => item.id === passageId);
      if (!passage || passage.type !== "space") return previous;

      const { leadIn, sceneText } = getSpacePassageFields(passage);
      const merged = [leadIn, sceneText].filter(Boolean).join("\n\n");

      const { [passageId]: _removed, ...remainingSpaces } = previous.spaces;

      const nextProject = {
        ...previous,
        passages: previous.passages.map((item) =>
          item.id === passageId
            ? { id: item.id, type: "fixed", text: merged }
            : item
        ),
        spaces: remainingSpaces,
      };

      setActiveSpaceId((current) =>
        current === passageId ? getFirstSpaceId(nextProject) : current
      );
      setPreviewPassageId((current) =>
        current === passageId
          ? nextProject.passages[0]?.id ?? null
          : current
      );

      return nextProject;
    });
  }, []);

  const saveProjectToFile = useCallback(async () => {
    const { project: projectToSave, failures } = await embedImagesInProject(project);

    if (failures.length > 0) {
      const names = failures.map((item) => item.name).join(", ");
      console.warn("Some images could not be embedded in the save file:", failures);
      window.alert(
        `Saved, but ${failures.length} image(s) could not be embedded (${names}). ` +
          "Re-open the space and regenerate those assets, then save again while the images still load in the browser."
      );
    }

    const blob = new Blob([serializeProject(projectToSave)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.title.replace(/\s+/g, "-").toLowerCase() || "story"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const loadProjectFromFile = useCallback(async (file) => {
    const text = await file.text();
    const loaded = deserializeProject(text);
    setProject(loaded);
    setActiveSpaceId(getFirstSpaceId(loaded));
    setPreviewPassageId(getDefaultPreviewPassageId(loaded));
  }, []);

  const getActiveSpace = useCallback(() => {
    if (!activeSpaceId) return null;
    return getSpaceForPassage(project, activeSpaceId);
  }, [project, activeSpaceId]);

  return {
    project,
    setProject,
    updateProject,
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
    setPreviewPassageId,
    selectPassageForPreview,
    getActiveSpace,
  };
}

function updateSpacePassageInProject(project, passageId, { leadIn, sceneText }) {
  const passage = project.passages.find((item) => item.id === passageId);
  if (!passage || passage.type !== "space") return project;

  const current = getSpacePassageFields(passage);
  const nextLeadIn = leadIn !== undefined ? leadIn : current.leadIn;
  const nextSceneText = sceneText !== undefined ? sceneText : current.sceneText;

  const normalized = normalizePassage({
    ...passage,
    leadIn: nextLeadIn,
    sceneText: nextSceneText,
  });

  const existingSpace = project.spaces[passageId] ?? createEmptySpace(passageId);

  return {
    ...project,
    passages: project.passages.map((item) =>
      item.id === passageId ? normalized : item
    ),
    spaces: {
      ...project.spaces,
      [passageId]: {
        ...existingSpace,
        excerpt: nextSceneText,
      },
    },
  };
}
