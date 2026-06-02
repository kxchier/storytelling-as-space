function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageUrlToDataUrlViaCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Could not load image: ${url}`));
    img.src = url;
  });
}

export function isPersistableImageUrl(url) {
  return typeof url === "string" && url.length > 0 && !url.startsWith("data:");
}

export async function imageUrlToDataUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      return blobToDataUrl(await response.blob());
    }
  } catch {
    // Fall back to canvas (works when the image is already in browser cache).
  }

  return imageUrlToDataUrlViaCanvas(url);
}

async function embedAssetImages(asset, failures) {
  if (!asset?.imageUrl || !isPersistableImageUrl(asset.imageUrl)) {
    return asset;
  }

  try {
    const imageUrl = await imageUrlToDataUrl(asset.imageUrl);
    return { ...asset, imageUrl };
  } catch (error) {
    failures.push({
      name: asset.name ?? asset.placedId ?? "asset",
      url: asset.imageUrl,
      message: error?.message ?? "Unknown error",
    });
    return asset;
  }
}

async function embedImagesInSpace(space, failures) {
  const assetCandidates = await Promise.all(
    (space.assetCandidates ?? []).map((asset) => embedAssetImages(asset, failures))
  );
  const placedAssets = await Promise.all(
    (space.placedAssets ?? []).map((asset) => embedAssetImages(asset, failures))
  );

  return { ...space, assetCandidates, placedAssets };
}

export async function embedImagesInProject(project) {
  const failures = [];
  const spaces = {};

  for (const [spaceId, space] of Object.entries(project.spaces ?? {})) {
    spaces[spaceId] = await embedImagesInSpace(space, failures);
  }

  return {
    project: { ...project, spaces },
    failures,
  };
}
