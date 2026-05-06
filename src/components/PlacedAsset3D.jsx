import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const MIN_SOLID_HITBOX_SCALE = 0.6;

function createAssetHitbox(asset) {
  const colliderScale = asset.colliderScale ?? 0.75;

  const baseWidthScale = asset.hitboxWidthScale ?? 0.8;
  const baseDepthScale = asset.hitboxDepthScale ?? 0.6;

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
  const height =
    hitboxBaseHeight * colliderScale * (asset.hitboxHeightScale ?? 1);
  const depth = hitboxBaseDepth * colliderScale * hitboxDepthScale;

  const offsetX = asset.hitboxOffsetX ?? 0;
  const offsetY = asset.hitboxOffsetY ?? 0;
  const offsetZ = asset.hitboxOffsetZ ?? 0;

  return {
    width,
    height,
    depth,
    offsetX,
    offsetY,
    offsetZ,
  };
}

function PlacedAsset3D({ asset, isSelected, onSelect, onUpdate }) {
  const texture = useTexture(asset.imageUrl);
  const { camera, pointer, raycaster, gl } = useThree();

  const [dragMode, setDragMode] = useState(null);
  const [isHoveringResizeHandle, setIsHoveringResizeHandle] = useState(false);

  const isMoving = dragMode === "move";
  const isResizing = dragMode === "resize";

  const floorPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }, []);

  const intersectionPoint = useMemo(() => {
    return new THREE.Vector3();
  }, []);

  const hitbox = useMemo(() => {
    return createAssetHitbox(asset);
  }, [asset]);

  const resizeHandleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#8c735f";
    ctx.beginPath();
    ctx.roundRect(8, 8, 112, 112, 20);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(44, 84);
    ctx.lineTo(80, 48);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 48);
    ctx.lineTo(80, 66);
    ctx.moveTo(80, 48);
    ctx.lineTo(62, 48);
    ctx.stroke();

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

  function safelyReleasePointerCapture(event) {
    if (event.target.hasPointerCapture?.(event.pointerId)) {
      event.target.releasePointerCapture(event.pointerId);
    }
  }

  function handleHitboxPointerDown(event) {
    if (isHoveringResizeHandle || isResizing) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    onSelect();

    setDragMode("move");
    gl.domElement.style.cursor = "grabbing";

    event.target.setPointerCapture(event.pointerId);
  }

  function handleHitboxPointerMove(event) {
    if (!isSelected || !isMoving) return;

    event.stopPropagation();

    const point = getPointerFloorPoint();

    onUpdate({
      x: point.x,
      z: point.z,
    });
  }

  function handleHitboxPointerUp(event) {
    event.stopPropagation();

    if (isMoving) {
      setDragMode(null);
      gl.domElement.style.cursor = "grab";
    }

    safelyReleasePointerCapture(event);
  }

  function handleHitboxPointerOver(event) {
    event.stopPropagation();

    if (!isResizing && !isHoveringResizeHandle) {
      gl.domElement.style.cursor = "grab";
    }
  }

  function handleHitboxPointerOut(event) {
    event.stopPropagation();

    if (!isMoving && !isResizing && !isHoveringResizeHandle) {
      gl.domElement.style.cursor = "default";
    }
  }

  function handleResizePointerDown(event) {
    event.stopPropagation();
    onSelect();

    setDragMode("resize");
    setIsHoveringResizeHandle(true);

    gl.domElement.style.cursor = "nesw-resize";

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

    setDragMode(null);
    setIsHoveringResizeHandle(false);

    gl.domElement.style.cursor = "default";

    safelyReleasePointerCapture(event);
  }

  function handleResizePointerOver(event) {
    event.stopPropagation();

    setIsHoveringResizeHandle(true);
    gl.domElement.style.cursor = "nesw-resize";
  }

  function handleResizePointerOut(event) {
    event.stopPropagation();

    if (!isResizing) {
      setIsHoveringResizeHandle(false);
      gl.domElement.style.cursor = "default";
    }
  }

  const hitboxYPosition = hitbox.height / 2 + hitbox.offsetY;

  const handlePadding = 0.16;

  const resizeHandlePosition = [
    hitbox.offsetX + hitbox.width / 2 + handlePadding,
    hitboxYPosition + hitbox.height / 2 + handlePadding,
    hitbox.offsetZ - hitbox.depth / 2 - handlePadding,
  ];

  return (
    <group position={[asset.x, asset.y, asset.z]}>
      {/* Image only. This no longer controls dragging. */}
      <sprite
        position={[0, asset.height / 2, 0]}
        scale={[asset.width, asset.height, 1]}
      >
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>

      {/* Hitbox controls selection and movement. */}
      <mesh
        position={[hitbox.offsetX, hitboxYPosition, hitbox.offsetZ]}
        renderOrder={10}
        onPointerDown={handleHitboxPointerDown}
        onPointerMove={handleHitboxPointerMove}
        onPointerUp={handleHitboxPointerUp}
        onPointerOver={handleHitboxPointerOver}
        onPointerOut={handleHitboxPointerOut}
      >
        <boxGeometry args={[hitbox.width, hitbox.height, hitbox.depth]} />
        <meshBasicMaterial
          color={asset.isSolid ? "#3f3026" : "#6a5242"}
          wireframe
          transparent
          opacity={isSelected ? 1 : 0}
          depthWrite={false}
        />
      </mesh>

      {isSelected && (
        <sprite
          renderOrder={20}
          position={resizeHandlePosition}
          scale={[0.65, 0.65, 1]}
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
      )}
    </group>
  );
}

export default PlacedAsset3D;