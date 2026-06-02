import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const imageCache = new Map();

function loadImageElement(url) {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    if (!url.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

  imageCache.set(url, promise);
  promise.catch(() => imageCache.delete(url));
  return promise;
}

function createTextureFromImage(image) {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function useSafeTexture(url) {
  const [texture, setTexture] = useState(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return undefined;
    }

    let cancelled = false;

    loadImageElement(url)
      .then((image) => {
        if (cancelled) return;
        const loaded = createTextureFromImage(image);
        setTexture(loaded);
        invalidate();
      })
      .catch(() => {
        if (!cancelled) {
          setTexture(null);
        }
      });

    return () => {
      cancelled = true;
      setTexture((previous) => {
        previous?.dispose();
        return null;
      });
    };
  }, [url, invalidate]);

  return texture;
}
