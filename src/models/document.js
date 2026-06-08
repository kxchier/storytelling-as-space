export const DOCUMENT_VERSION = 2;
export const BLANK_TOKEN = "___";

export function createId() {
  return crypto.randomUUID();
}

export function createEmptySpace(
  passageId,
  { title = "Untitled vignette", excerpt = "", sceneText = "" } = {}
) {
  return {
    passageId,
    title,
    status: "draft",
    excerpt: sceneText || excerpt,
    assetCandidates: [],
    selectedAssetId: null,
    placedAssets: [],
    selectedPlacedAssetId: null,
    playtestActionHistory: [],
  };
}

export function getSpacePassageFields(passage) {
  if (!passage || passage.type !== "space") {
    return { leadIn: "", sceneText: passage?.text ?? "" };
  }

  if (passage.leadIn != null || passage.sceneText != null) {
    return {
      leadIn: passage.leadIn ?? "",
      sceneText: passage.sceneText ?? "",
    };
  }

  const raw = passage.text ?? "";
  if (raw.includes(BLANK_TOKEN)) {
    const withoutBlanks = raw.replaceAll(BLANK_TOKEN, " ").replace(/\s+/g, " ").trim();
    const parts = withoutBlanks.split(/\n\n+/);
    if (parts.length >= 2) {
      return { leadIn: parts[0].trim(), sceneText: parts.slice(1).join("\n\n").trim() };
    }
    return { leadIn: "", sceneText: withoutBlanks };
  }

  const parts = raw.split(/\n\n+/);
  if (parts.length >= 2) {
    return { leadIn: parts[0].trim(), sceneText: parts.slice(1).join("\n\n").trim() };
  }

  return { leadIn: raw.trim(), sceneText: "" };
}

export function passageToLegacyText(passage) {
  if (passage.type !== "space") return passage.text ?? "";
  const { leadIn, sceneText } = getSpacePassageFields(passage);
  if (leadIn && sceneText) return `${leadIn}\n\n${sceneText}`;
  return leadIn || sceneText;
}

export function normalizePassage(passage) {
  if (passage.type !== "space") {
    return passage;
  }

  const { leadIn, sceneText } = getSpacePassageFields(passage);
  return {
    ...passage,
    leadIn,
    sceneText,
    text: passageToLegacyText({ ...passage, leadIn, sceneText }),
  };
}

export function normalizeProject(project) {
  return {
    ...project,
    version: DOCUMENT_VERSION,
    passages: project.passages.map(normalizePassage),
  };
}

export function createEmptyProject() {
  const introId = createId();
  const approachId = createId();
  const spaceId = createId();
  const outroId = createId();

  const sceneText =
    "An unmade bed sits against the left wall, its blanket wrinkled as though someone had just climbed out. Across from it is a wooden desk crowded with loose papers, old notebooks, a chipped mug full of pens, and a lamp with a crooked shade.";

  return {
    version: DOCUMENT_VERSION,
    title: "Childhood Bedroom",
    passages: [
      {
        id: introId,
        type: "fixed",
        text: "She had not opened her bedroom door in years. Her fingers slid over the cool metal handle, pausing where it dipped beneath her thumb. When she finally took a deep breath and turned the knob, the room gave way slowly, exhaling with her as she stepped inside.",
      },
      {
        id: spaceId,
        type: "space",
        leadIn: "",
        sceneText,
        text: sceneText,
      },
      {
        id: outroId,
        type: "fixed",
        text: "When she stepped back into the hallway, the room did not feel smaller behind her. If anything, it had widened, unfolding in her mind through the things she had almost forgotten.",
      },
    ],
    spaces: {
      [spaceId]: createEmptySpace(spaceId, {
        title: "Bedroom",
        sceneText,
      }),
    },
  };
}

export function countBlanks(text) {
  if (!text) return 0;
  return text.split(BLANK_TOKEN).length - 1;
}

export function createFixedPassage(text = "") {
  return {
    id: createId(),
    type: "fixed",
    text,
  };
}

export function createSpacePassageEntry({ sceneText = "", title = "Untitled vignette" } = {}) {
  const passageId = createId();
  const passage = normalizePassage({
    id: passageId,
    type: "space",
    leadIn: "",
    sceneText,
    text: sceneText,
  });

  return {
    passage,
    space: createEmptySpace(passageId, { title, sceneText }),
  };
}

export function getSpacePassages(project) {
  return project.passages.filter((passage) => passage.type === "space");
}

export function getPassageById(project, passageId) {
  return project.passages.find((passage) => passage.id === passageId);
}

export function getSpaceForPassage(project, passageId) {
  return project.spaces[passageId] ?? null;
}

export function serializeProject(project) {
  return JSON.stringify(normalizeProject(project), null, 2);
}

export function deserializeProject(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid project file");
  }

  return normalizeProject({
    version: parsed.version ?? DOCUMENT_VERSION,
    title: parsed.title ?? "Untitled story",
    passages: Array.isArray(parsed.passages) ? parsed.passages : [],
    spaces:
      parsed.spaces && typeof parsed.spaces === "object" ? parsed.spaces : {},
  });
}

export function buildFullManuscriptText(project) {
  return project.passages
    .map((passage) =>
      passage.type === "space" ? passageToLegacyText(passage) : passage.text
    )
    .join("\n\n");
}

function normalizePhraseForCompare(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/, "");
}

export function phraseAnchorDiffersFromName(name, phrase) {
  if (!phrase?.trim() || !name?.trim()) return false;
  return normalizePhraseForCompare(name) !== normalizePhraseForCompare(phrase);
}

export function findPhraseAnchor(text, name) {
  if (!text || !name) return null;
  const lowerText = text.toLowerCase();
  const lowerName = name.toLowerCase();
  const index = lowerText.indexOf(lowerName);
  if (index === -1) return null;

  let phraseStart = index;
  const before = text.slice(0, index);
  const adjectiveMatch = before.match(
    /(?:^|[\s,;])(?:(?:a|an|the)\s+)?([\w-]+)\s*$/
  );
  if (adjectiveMatch && adjectiveMatch[1].toLowerCase() !== lowerName) {
    const word = adjectiveMatch[1];
    const wordLower = word.toLowerCase();
    if (
      wordLower.length > 2 &&
      !["and", "or", "the", "a", "an", "of", "at", "in", "on", "to"].includes(
        wordLower
      )
    ) {
      phraseStart = index - word.length;
    }
  }

  const phraseEnd = index + name.length;
  const phrase = text.slice(phraseStart, phraseEnd).trim();

  return {
    start: phraseStart,
    end: phraseEnd,
    phrase,
  };
}

export function splitSelectionIntoSpaceParts(selectedText) {
  const trimmed = selectedText.trim();
  const parts = trimmed.split(/\n\n+/);

  if (parts.length >= 2) {
    return {
      leadIn: parts[0].trim(),
      sceneText: parts.slice(1).join("\n\n").trim(),
    };
  }

  return { leadIn: "", sceneText: trimmed };
}
