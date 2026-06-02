import { useSafeTexture } from "../hooks/useSafeTexture";

function TexturedMaterial({ textureUrl, fallbackColor }) {
  const texture = useSafeTexture(textureUrl);

  return (
    <meshStandardMaterial
      map={texture || null}
      color={texture ? "white" : fallbackColor}
    />
  );
}

function IsometricRoom({ floorTextureUrl, wallTextureUrl }) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <TexturedMaterial
          textureUrl={floorTextureUrl}
          fallbackColor="#d8b88f"
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2, -4]}>
        <planeGeometry args={[8, 4]} />
        <TexturedMaterial
          textureUrl={wallTextureUrl}
          fallbackColor="#f1dfc7"
        />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-4, 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <TexturedMaterial
          textureUrl={wallTextureUrl}
          fallbackColor="#ead3b8"
        />
      </mesh>
    </group>
  );
}

export default IsometricRoom;