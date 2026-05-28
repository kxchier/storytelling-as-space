import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import {
  PLAYER_FLOOR_Y,
  PLAYER_HALF_DEPTH,
  PLAYER_HALF_WIDTH,
  PLAYER_SCALE,
} from "../constants/player";

const STEP = 0.25;

const ROOM_LIMIT = 3.82;

const SCALE = PLAYER_SCALE;

const SWING_AMOUNT = 0.42;
const WALK_FADE_MS = 380;

const COLORS = {
  skin: "#e8c4a8",
  shirt: "#5a7a9a",
  pants: "#4a3f38",
  shoes: "#2d2520",
};

function s(value) {
  return value * SCALE;
}

function collidesWithAnyObject(nextX, nextZ, collisionObjects) {
  return collisionObjects.some((object) => {
    const halfWidth = object.halfWidth ?? object.width / 2;
    const halfDepth = object.halfDepth ?? object.depth / 2;

    return (
      Math.abs(nextX - object.x) <= PLAYER_HALF_WIDTH + halfWidth &&
      Math.abs(nextZ - object.z) <= PLAYER_HALF_DEPTH + halfDepth
    );
  });
}

function isInsideRoom(nextX, nextZ) {
  return (
    nextX >= -ROOM_LIMIT &&
    nextX <= ROOM_LIMIT &&
    nextZ >= -ROOM_LIMIT &&
    nextZ <= ROOM_LIMIT
  );
}

function Limb({ pivot, size, color, meshOffset, limbRef }) {
  return (
    <group ref={limbRef} position={pivot}>
      <mesh position={meshOffset}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function SimpleCharacter({ lastMoveRef }) {
  const walkPhaseRef = useRef(0);
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  const hipY = s(0.11);
  const legHalfHeight = s(0.055);
  const shoeHalfHeight = s(0.02);
  // Shoe sole at local y = 0: hipY + shoeY - shoeHalfHeight = 0
  const shoeYFromHip = -hipY + shoeHalfHeight;
  const shoulderY = s(0.27);
  const armHalfHeight = s(0.07);

  useFrame((_, delta) => {
    const elapsed = performance.now() - lastMoveRef.current;
    const walkBlend = Math.max(0, 1 - elapsed / WALK_FADE_MS);

    if (walkBlend > 0) {
      walkPhaseRef.current += delta * 11;
    }

    const swing = Math.sin(walkPhaseRef.current) * SWING_AMOUNT * walkBlend;

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = swing;
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -swing;
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -swing * 0.85;
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = swing * 0.85;
    }
  });

  return (
    <group>
      <group ref={leftLegRef} position={[-s(0.045), hipY, 0]}>
        <mesh position={[0, -legHalfHeight, 0]}>
          <boxGeometry args={[s(0.05), s(0.11), s(0.06)]} />
          <meshStandardMaterial color={COLORS.pants} />
        </mesh>
        <mesh position={[0, shoeYFromHip, s(0.02)]}>
          <boxGeometry args={[s(0.055), s(0.04), s(0.07)]} />
          <meshStandardMaterial color={COLORS.shoes} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[s(0.045), hipY, 0]}>
        <mesh position={[0, -legHalfHeight, 0]}>
          <boxGeometry args={[s(0.05), s(0.11), s(0.06)]} />
          <meshStandardMaterial color={COLORS.pants} />
        </mesh>
        <mesh position={[0, shoeYFromHip, s(0.02)]}>
          <boxGeometry args={[s(0.055), s(0.04), s(0.07)]} />
          <meshStandardMaterial color={COLORS.shoes} />
        </mesh>
      </group>

      <mesh position={[0, s(0.2), 0]}>
        <boxGeometry args={[s(0.14), s(0.18), s(0.09)]} />
        <meshStandardMaterial color={COLORS.shirt} />
      </mesh>

      <Limb
        limbRef={leftArmRef}
        pivot={[-s(0.1), shoulderY, 0]}
        meshOffset={[0, -armHalfHeight, 0]}
        size={[s(0.05), s(0.14), s(0.05)]}
        color={COLORS.shirt}
      />
      <Limb
        limbRef={rightArmRef}
        pivot={[s(0.1), shoulderY, 0]}
        meshOffset={[0, -armHalfHeight, 0]}
        size={[s(0.05), s(0.14), s(0.05)]}
        color={COLORS.shirt}
      />

      <mesh position={[0, s(0.34), 0]}>
        <boxGeometry args={[s(0.11), s(0.11), s(0.11)]} />
        <meshStandardMaterial color={COLORS.skin} />
      </mesh>
    </group>
  );
}

function Player({
  collisionObjects = [],
  onPositionChange,
  inputEnabled = true,
}) {
  const lastMoveRef = useRef(0);

  const [playerState, setPlayerState] = useState({
    position: [0, 0, 0],
    facing: 0,
  });

  const { position, facing } = playerState;

  useEffect(() => {
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  useEffect(() => {
    if (!inputEnabled) return undefined;

    function handleKeyDown(event) {
      if (event.repeat) return;

      setPlayerState((previousState) => {
        const [x, y, z] = previousState.position;
        let nextX = x;
        let nextZ = z;

        const key = event.key.toLowerCase();

        if (key === "arrowup" || key === "w") {
          nextZ -= STEP;
        }

        if (key === "arrowdown" || key === "s") {
          nextZ += STEP;
        }

        if (key === "arrowleft" || key === "a") {
          nextX -= STEP;
        }

        if (key === "arrowright" || key === "d") {
          nextX += STEP;
        }

        if (nextX === x && nextZ === z) {
          return previousState;
        }

        if (!isInsideRoom(nextX, nextZ)) {
          return previousState;
        }

        if (collidesWithAnyObject(nextX, nextZ, collisionObjects)) {
          return previousState;
        }

        lastMoveRef.current = performance.now();

        return {
          position: [nextX, y, nextZ],
          facing: Math.atan2(nextX - x, nextZ - z),
        };
      });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [collisionObjects, inputEnabled]);

  const [x, , z] = position;

  return (
    <group position={[x, PLAYER_FLOOR_Y, z]} rotation={[0, facing, 0]}>
      <SimpleCharacter lastMoveRef={lastMoveRef} />
    </group>
  );
}

export default Player;
