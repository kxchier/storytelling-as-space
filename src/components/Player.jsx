import { useEffect, useState } from "react";

function Player() {
  const [position, setPosition] = useState([0, 0.15, 0]);

  useEffect(() => {
    function handleKeyDown(event) {
      setPosition(([x, y, z]) => {
        const step = 0.25;

        if (event.key === "ArrowUp" || event.key === "w") {
          return [x, y, z - step];
        }

        if (event.key === "ArrowDown" || event.key === "s") {
          return [x, y, z + step];
        }

        if (event.key === "ArrowLeft" || event.key === "a") {
          return [x - step, y, z];
        }

        if (event.key === "ArrowRight" || event.key === "d") {
          return [x + step, y, z];
        }

        return [x, y, z];
      });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshStandardMaterial />
    </mesh>
  );
}

export default Player;