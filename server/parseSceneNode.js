import { buildAssetPrompt } from "./assetPrompt.js";

const IGNORE_WORDS = new Set([
  "she",
  "he",
  "they",
  "it",
  "rain",
  "sadness",
  "silence",
  "memory",
  "loneliness",
  "warmth",
  "light",
  "sound",
  "room",
  "scene",
]);

const CATEGORY_RULES = {
  furniture: ["desk", "table", "chair", "bed", "counter", "shelf", "sofa"],
  architecture: ["window", "door", "wall", "floor", "ceiling", "stairs"],
  lighting: ["lamp", "lantern", "candle", "light"],
  decor: ["rug", "painting", "poster", "curtain", "mirror", "vase"],
  nature: ["plant", "flower", "tree"],
};

function cleanName(text) {
  let name = text.toLowerCase().trim();

  for (const prefix of ["a ", "an ", "the ", "her ", "his ", "their ", "my "]) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
    }
  }

  return name.trim();
}

function categorize(name) {
  for (const [category, words] of Object.entries(CATEGORY_RULES)) {
    if (words.some((word) => name.includes(word))) {
      return category;
    }
  }

  return "object";
}

function placementType(category, name) {
  if (
    category === "architecture" &&
    ["window", "door", "wall"].some((word) => name.includes(word))
  ) {
    return "wall";
  }

  if (["furniture", "object", "decor", "nature", "lighting"].includes(category)) {
    return "floor";
  }

  return "sprite";
}

function addAsset(assets, seen, rawName) {
  const name = cleanName(rawName);

  if (!name || name.length < 2 || IGNORE_WORDS.has(name) || seen.has(name)) {
    return;
  }

  seen.add(name);

  const category = categorize(name);

  assets.push({
    name,
    category,
    placementType: placementType(category, name),
    prompt: buildAssetPrompt(name),
  });
}

export function parseSceneInNode(sceneText) {
  const seen = new Set();
  const assets = [];
  const normalizedText = sceneText.replace(/\s+/g, " ").trim();

  const articlePattern =
    /\b(?:a|an|the|her|his|their|my)\s+([a-z][a-z\s-]{0,40}?)(?=[\s,.;!?]|$)/gi;

  let match = articlePattern.exec(normalizedText);

  while (match) {
    addAsset(assets, seen, match[1]);
    match = articlePattern.exec(normalizedText);
  }

  const lowerText = normalizedText.toLowerCase();

  for (const words of Object.values(CATEGORY_RULES)) {
    for (const word of words) {
      if (lowerText.includes(word)) {
        addAsset(assets, seen, word);
      }
    }
  }

  const knownPhrases = [
    "school bag",
    "mug of tea",
    "cup of tea",
    "stack of books",
  ];

  for (const phrase of knownPhrases) {
    if (lowerText.includes(phrase)) {
      addAsset(assets, seen, phrase);
    }
  }

  const dedupedAssets = assets.filter(
    (asset, index, allAssets) =>
      !allAssets.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.name.length > asset.name.length &&
          other.name.includes(asset.name)
      )
  );

  return { assets: dedupedAssets };
}
