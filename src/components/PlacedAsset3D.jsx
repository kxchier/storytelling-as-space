import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function PlacedAsset3D({ asset, isSelected, onSelect, onUpdate }) {
  const texture = useTexture(asset.imageUrl);
  const { camera, pointer, raycaster, gl } = useThree();

  const [isResizing, setIsResizing] = useState(false);

  const floorPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }, []);

  const intersectionPoint = useMemo(() => {
    return new THREE.Vector3();
  }, []);

  const resizeHandleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
  
    const ctx = canvas.getContext("2d");
  
    // purple rounded square
    ctx.fillStyle = "#7f5af0";
    ctx.beginPath();
    ctx.roundRect(8, 8, 112, 112, 20);
    ctx.fill();
  
    // white resize arrow
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // main diagonal line
    ctx.beginPath();
    ctx.moveTo(44, 84);
    ctx.lineTo(80, 48);
    ctx.stroke();

    // arrowhead near top-right, pulled inward
    ctx.beginPath();
    ctx.moveTo(80, 48);
    ctx.lineTo(80, 66);
    ctx.moveTo(80, 48);
    ctx.lineTo(62, 48);
    ctx.stroke();

    // small corner mark near bottom-left
    ctx.beginPath();
    ctx.moveTo(44, 68);
    ctx.lineTo(44, 84);
    ctx.lineTo(60, 84);
    ctx.stroke();
  
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
  
    return texture;
  }, []);

  function getPointerFloorPoint() {
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(floorPlane, intersectionPoint);
  
    return {
      x: intersectionPoint.x,
      z: intersectionPoint.z,
    };
  }

  function handleAssetPointerDown(event) {
    event.stopPropagation();
    onSelect();
  
    gl.domElement.style.cursor = "grabbing";
  }

  function handleAssetPointerMove(event) {
    if (!isSelected || !event.buttons || isResizing) return;

    event.stopPropagation();

    const point = getPointerFloorPoint();

    onUpdate({
      x: point.x,
      z: point.z,
    });
  }

  function handleResizePointerDown(event) {
    event.stopPropagation();
    onSelect();
    setIsResizing(true);

    event.target.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(event) {
    if (!isResizing) return;

    event.stopPropagation();

    const point = getPointerFloorPoint();

    const distanceFromCenter = Math.sqrt(
      (point.x - asset.x) ** 2 + (point.z - asset.z) ** 2
    );

    const newSize = Math.max(0.4, distanceFromCenter * 2);

    onUpdate({
      width: newSize,
      height: newSize,
    });
  }

  function handleResizePointerUp(event) {
    event.stopPropagation();
    setIsResizing(false);
  
    gl.domElement.style.cursor = "default";
    event.target.releasePointerCapture(event.pointerId);
  }

  function handleResizePointerOver(event) {
    event.stopPropagation();
    gl.domElement.style.cursor = "nesw-resize";
  }
  
  function handleResizePointerOut(event) {
    event.stopPropagation();
    gl.domElement.style.cursor = "default";
  }

  function handleAssetPointerOver(event) {
    event.stopPropagation();
  
    if (!isResizing) {
      gl.domElement.style.cursor = "grab";
    }
  }
  
  function handleAssetPointerOut(event) {
    event.stopPropagation();
  
    if (!isResizing) {
      gl.domElement.style.cursor = "default";
    }
  }

  return (
    <group position={[asset.x, asset.y + asset.height / 2, asset.z]}>
      <sprite
        scale={[asset.width, asset.height, 1]}
        onPointerDown={handleAssetPointerDown}
        onPointerMove={handleAssetPointerMove}
        onPointerOver={handleAssetPointerOver}
        onPointerOut={handleAssetPointerOut}
      >
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>

      {isSelected && (
        <>
          {/* selection border */}
          <group position={[0, 0, 0.04]} scale={[asset.width, asset.height, 1]}>
            {/* top */}
            <mesh position={[0, 0.53, 0]}>
              <planeGeometry args={[1.08, 0.045]} />
              <meshBasicMaterial color="#7f5af0" transparent opacity={0.85} />
            </mesh>

            {/* bottom */}
            <mesh position={[0, -0.53, 0]}>
              <planeGeometry args={[1.08, 0.045]} />
              <meshBasicMaterial color="#7f5af0" transparent opacity={0.85} />
            </mesh>

            {/* left */}
            <mesh position={[-0.53, 0, 0]}>
              <planeGeometry args={[0.045, 1.08]} />
              <meshBasicMaterial color="#7f5af0" transparent opacity={0.85} />
            </mesh>

            {/* right */}
            <mesh position={[0.53, 0, 0]}>
              <planeGeometry args={[0.045, 1.08]} />
              <meshBasicMaterial color="#7f5af0" transparent opacity={0.85} />
            </mesh>
          </group>

          {/* resize handle */}
          {/* resize handle */}
          <sprite
            position={[asset.width / 2 + 0.18, asset.height / 2 + 0.18, 0.08]}
            scale={[0.42, 0.42, 1]}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerOver={handleResizePointerOver}
            onPointerOut={handleResizePointerOut}
          >
            <spriteMaterial
              map={resizeHandleTexture}
              transparent
              depthTest={false}
              depthWrite={false}
            />
          </sprite>
        </>
      )}
    </group>
  );
}

export default PlacedAsset3D;