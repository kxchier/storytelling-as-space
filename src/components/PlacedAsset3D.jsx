import { useTexture } from "@react-three/drei";

function PlacedAsset3D({ asset }) {
  const texture = useTexture(asset.imageUrl);

  return (
    <sprite
      position={[asset.x, asset.y + asset.height / 2, asset.z]}
      scale={[asset.width, asset.height, 1]}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
      />
    </sprite>
  );
}

export default PlacedAsset3D;