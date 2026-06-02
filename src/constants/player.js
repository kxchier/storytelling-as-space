export const PLAYER_SCALE = 3.2;

// Room floor is a zero-thickness plane at y = 0; nudge the player up slightly
// so shoe boxes don't z-fight with the floor mesh.
export const PLAYER_FLOOR_Y = 0.02;

function scaled(value) {
  return value * PLAYER_SCALE;
}

// Floor footprint matched to the mesh (slightly inset so corners don't snag).
export const PLAYER_HALF_WIDTH = scaled(0.12) * 0.9;
export const PLAYER_HALF_DEPTH = scaled(0.085) * 0.9;

/** Extra reach beyond the player footprint for interaction prompts. */
export const INTERACTION_PROXIMITY_PADDING = 0.22;

export const PLAYER_INTERACTION_REACH = Math.hypot(
  PLAYER_HALF_WIDTH,
  PLAYER_HALF_DEPTH
);
