const MIN_SOLID_HITBOX_SCALE = 0.6;

export function createAssetHitbox(asset) {
  const colliderScale = asset.colliderScale ?? 0.75;

  const baseWidthScale = asset.hitboxWidthScale ?? 0.8;
  const baseDepthScale = asset.hitboxDepthScale ?? 0.6;
  const baseHeightScale = asset.hitboxHeightScale ?? 1;

  const hitboxWidthScale = asset.isSolid
    ? Math.max(baseWidthScale, MIN_SOLID_HITBOX_SCALE)
    : baseWidthScale;

  const hitboxDepthScale = asset.isSolid
    ? Math.max(baseDepthScale, MIN_SOLID_HITBOX_SCALE)
    : baseDepthScale;

  const hitboxBaseWidth = asset.hitboxBaseWidth ?? asset.width;
  const hitboxBaseHeight = asset.hitboxBaseHeight ?? asset.height;
  const hitboxBaseDepth = asset.hitboxBaseDepth ?? asset.width;

  const width = hitboxBaseWidth * colliderScale * hitboxWidthScale;
  const height = hitboxBaseHeight * colliderScale * baseHeightScale;
  const depth = hitboxBaseDepth * colliderScale * hitboxDepthScale;

  const offsetX = asset.hitboxOffsetX ?? 0;
  const offsetY = asset.hitboxOffsetY ?? 0;
  const offsetZ = asset.hitboxOffsetZ ?? 0;

  return {
    x: asset.x + offsetX,
    y: asset.y + height / 2 + offsetY,
    z: asset.z + offsetZ,
    width,
    height,
    depth,
    halfWidth: width / 2,
    halfHeight: height / 2,
    halfDepth: depth / 2,
  };
}

export function createLocalAssetHitbox(asset) {
  const colliderScale = asset.colliderScale ?? 0.75;

  const baseWidthScale = asset.hitboxWidthScale ?? 0.8;
  const baseDepthScale = asset.hitboxDepthScale ?? 0.6;
  const baseHeightScale = asset.hitboxHeightScale ?? 1;

  const hitboxWidthScale = asset.isSolid
    ? Math.max(baseWidthScale, MIN_SOLID_HITBOX_SCALE)
    : baseWidthScale;

  const hitboxDepthScale = asset.isSolid
    ? Math.max(baseDepthScale, MIN_SOLID_HITBOX_SCALE)
    : baseDepthScale;

  const hitboxBaseWidth = asset.hitboxBaseWidth ?? asset.width;
  const hitboxBaseHeight = asset.hitboxBaseHeight ?? asset.height;
  const hitboxBaseDepth = asset.hitboxBaseDepth ?? asset.width;

  const width = hitboxBaseWidth * colliderScale * hitboxWidthScale;
  const height = hitboxBaseHeight * colliderScale * baseHeightScale;
  const depth = hitboxBaseDepth * colliderScale * hitboxDepthScale;

  return {
    width,
    height,
    depth,
    offsetX: asset.hitboxOffsetX ?? 0,
    offsetY: asset.hitboxOffsetY ?? 0,
    offsetZ: asset.hitboxOffsetZ ?? 0,
  };
}
