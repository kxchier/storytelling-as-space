import { findPhraseAnchor, phraseAnchorDiffersFromName } from "../models/document";
import { apiUrl } from "./apiBase";

export async function parseSceneExcerpt(sceneText) {
  const response = await fetch(apiUrl("/parse-scene"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sceneText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to parse scene");
  }

  if (!Array.isArray(data.assets)) {
    throw new Error("Parser returned an invalid response");
  }

  return data.assets;
}

export function enrichParsedAssets(assets, excerpt) {
  return assets.map((asset) => {
    const anchor = findPhraseAnchor(excerpt, asset.name);
    const sourcePhrase =
      anchor?.phrase &&
      phraseAnchorDiffersFromName(asset.name, anchor.phrase)
        ? anchor.phrase
        : null;

    return {
      id: crypto.randomUUID(),
      name: asset.name,
      category: asset.category,
      placementType: asset.placementType ?? "sprite",
      prompt: asset.prompt,
      interactions: [],
      sourcePhrase,
      sourceAnchor: anchor,
    };
  });
}
