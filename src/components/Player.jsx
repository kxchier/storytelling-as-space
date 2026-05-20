import { useEffect, useState } from "react";

const STEP = 0.25;

// visible size of the avatar
const PLAYER_RADIUS = 0.18;

// collision size of the avatar
// smaller than visual radius so the player does not stop too far away
const PLAYER_COLLISION_RADIUS = 0.08;

const ROOM_LIMIT = 3.82;

function collidesWithAnyObject(nextX, nextZ, collisionObjects) {
  return collisionObjects.some((object) => {
    const halfWidth = object.halfWidth ?? object.width / 2;
    const halfDepth = object.halfDepth ?? object.depth / 2;

    return (
      Math.abs(nextX - object.x) <= PLAYER_COLLISION_RADIUS + halfWidth &&
      Math.abs(nextZ - object.z) <= PLAYER_COLLISION_RADIUS + halfDepth
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

function Player({ collisionObjects = [], onPositionChange }) {
  const [position, setPosition] = useState([0, 0.15, 0]);

  useEffect(() => {
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  useEffect(() => {
    function handleKeyDown(event) {
      setPosition(([x, y, z]) => {
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
          return [x, y, z];
        }

        if (!isInsideRoom(nextX, nextZ)) {
          return [x, y, z];
        }

        if (collidesWithAnyObject(nextX, nextZ, collisionObjects)) {
          return [x, y, z];
        }

        return [nextX, y, nextZ];
      });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [collisionObjects]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[PLAYER_RADIUS, 24, 24]} />
      <meshStandardMaterial />
    </mesh>
  );
}

export default Player;