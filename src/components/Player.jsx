import { useEffect, useState } from "react";

const STEP = 0.25;
const PLAYER_RADIUS = 0.18;
const ROOM_LIMIT = 3.82;

function collidesWithAnyObject(nextX, nextZ, collisionObjects) {
  return collisionObjects.some((object) => {
    return (
      Math.abs(nextX - object.x) <= PLAYER_RADIUS + object.halfWidth &&
      Math.abs(nextZ - object.z) <= PLAYER_RADIUS + object.halfDepth
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

function Player({ collisionObjects = [] }) {
  const [position, setPosition] = useState([0, 0.15, 0]);

  useEffect(() => {
    function handleKeyDown(event) {
      setPosition(([x, y, z]) => {
        let nextX = x;
        let nextZ = z;

        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
          nextZ -= STEP;
        }

        if (
          event.key === "ArrowDown" ||
          event.key === "s" ||
          event.key === "S"
        ) {
          nextZ += STEP;
        }

        if (
          event.key === "ArrowLeft" ||
          event.key === "a" ||
          event.key === "A"
        ) {
          nextX -= STEP;
        }

        if (
          event.key === "ArrowRight" ||
          event.key === "d" ||
          event.key === "D"
        ) {
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