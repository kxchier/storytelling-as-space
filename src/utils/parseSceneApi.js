import { apiUrl } from "./apiBase";

export async function parseSceneExcerpt(sceneText) {
  const response = await fetch(apiUrl("/parse-scene"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sceneText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to extract props");
  }

  if (!Array.isArray(data.assets)) {
    throw new Error("Parser returned an invalid response");
  }

  return data.assets;
}

export function enrichParsedAssets(assets) {
  return assets.map((asset) => ({
    id: crypto.randomUUID(),
    name: asset.name,
    category: asset.category,
    placementType: asset.placementType ?? "sprite",
    prompt: asset.prompt,
    interactions: [],
  }));
}
