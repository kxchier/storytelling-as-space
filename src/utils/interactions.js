import {
  INTERACTION_PROXIMITY_PADDING,
  PLAYER_HALF_DEPTH,
  PLAYER_HALF_WIDTH,
  PLAYER_INTERACTION_REACH,
} from "../constants/player";

const DEFAULT_INTERACTIONS_BY_CATEGORY = {
  furniture: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She studied the {name}, taking in every worn detail.",
      completesSpace: false,
    },
    {
      id: "touch",
      label: "Touch",
      narrativeTemplate: "She rested her hand on the {name}.",
      completesSpace: false,
    },
    {
      id: "lean",
      label: "Lean against",
      narrativeTemplate: "She leaned against the {name} for a moment.",
      completesSpace: false,
    },
  ],
  object: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She turned the {name} over in her hands.",
      completesSpace: false,
    },
    {
      id: "pick-up",
      label: "Pick up",
      narrativeTemplate: "She picked up the {name}.",
      completesSpace: false,
    },
    {
      id: "use",
      label: "Use",
      narrativeTemplate: "She used the {name}, careful and deliberate.",
      completesSpace: false,
    },
    {
      id: "open",
      label: "Open",
      narrativeTemplate: "She opened the {name}.",
      completesSpace: false,
    },
  ],
  decor: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She looked closely at the {name}.",
      completesSpace: false,
    },
    {
      id: "adjust",
      label: "Straighten",
      narrativeTemplate: "She nudged the {name} into a neater place.",
      completesSpace: false,
    },
  ],
  architecture: [
    {
      id: "look-through",
      label: "Look through",
      narrativeTemplate: "She gazed through the {name}, lost in thought.",
      completesSpace: false,
    },
    {
      id: "listen",
      label: "Listen",
      narrativeTemplate: "She listened at the {name}.",
      completesSpace: false,
    },
  ],
  lighting: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "The {name} cast a soft glow across her face.",
      completesSpace: false,
    },
    {
      id: "adjust",
      label: "Adjust",
      narrativeTemplate: "She adjusted the {name} until the light felt right.",
      completesSpace: false,
    },
  ],
  nature: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She brushed a finger along the {name}.",
      completesSpace: false,
    },
    {
      id: "tend",
      label: "Tend to",
      narrativeTemplate: "She tended to the {name} with quiet care.",
      completesSpace: false,
    },
  ],
};

const FALLBACK_INTERACTIONS = DEFAULT_INTERACTIONS_BY_CATEGORY.object;

export function getDefaultInteractionsForCategory(category) {
  return (
    DEFAULT_INTERACTIONS_BY_CATEGORY[category] ?? FALLBACK_INTERACTIONS
  ).map((action) => ({ ...action }));
}

export function getInteractionsForAsset(asset) {
  const source = asset.interactions?.length
    ? asset.interactions
    : getDefaultInteractionsForCategory(asset.category);

  return source.map((action) => ({
    ...action,
    completesSpace: Boolean(action.completesSpace),
  }));
}

export function getPlayableInteractions(asset) {
  return getInteractionsForAsset(asset).filter((action) =>
    Boolean(action.label?.trim())
  );
}

export function createInteractionAction({
  label = "",
  narrativeTemplate = "She interacted with the {name}.",
  completesSpace = false,
} = {}) {
  return {
    id: crypto.randomUUID(),
    label,
    narrativeTemplate,
    completesSpace,
  };
}

export function buildNarrativeLine(action, assetName) {
  const template =
    action.narrativeTemplate?.trim() ||
    `She chose to ${action.label.toLowerCase()} the {name}.`;

  return template.replace(/\{name\}/g, assetName);
}

export function buildExplorationNarrative(actionHistory) {
  if (!actionHistory?.length) return "";
  return actionHistory.map((entry) => entry.narrativeLine).join(" ");
}

export function buildSpaceExitNarrative(leadIn, actionHistory) {
  const exploration = buildExplorationNarrative(actionHistory);
  const lead = leadIn?.trim() ?? "";

  if (!exploration) return lead;
  if (!lead) return exploration;

  return `${lead}\n\n${exploration}`;
}

export function actionCompletesSpace(action) {
  return Boolean(action?.completesSpace);
}

export function historyEntryCompletesSpace(entry, placedAssets) {
  const asset = placedAssets.find((item) => item.placedId === entry.placedId);
  if (!asset) return false;

  const interactions = getInteractionsForAsset(asset);
  const matched = interactions.find((action) => action.id === entry.actionId);
  return actionCompletesSpace(matched);
}

export function getSpaceWinCondition(placedAssets) {
  for (const asset of placedAssets) {
    for (const action of getInteractionsForAsset(asset)) {
      if (actionCompletesSpace(action)) {
        return {
          placedId: asset.placedId,
          assetName: asset.name,
          actionId: action.id,
          actionLabel: action.label,
        };
      }
    }
  }
  return null;
}

export function isWinConditionMet(actionHistory, placedAssets) {
  if (!actionHistory?.length) return false;
  const lastEntry = actionHistory[actionHistory.length - 1];
  return historyEntryCompletesSpace(lastEntry, placedAssets);
}

function horizontalDistanceToHitbox(playerX, playerZ, hitbox) {
  const dx = Math.max(0, Math.abs(playerX - hitbox.x) - hitbox.halfWidth);
  const dz = Math.max(0, Math.abs(playerZ - hitbox.z) - hitbox.halfDepth);
  return Math.hypot(dx, dz);
}

/** True when the player's floor footprint overlaps the hitbox (plus a small pad). */
export function isPlayerInHitboxProximity(playerPosition, hitbox) {
  const [playerX, , playerZ] = playerPosition;
  const separation = horizontalDistanceToHitbox(playerX, playerZ, hitbox);
  const maxReach =
    PLAYER_INTERACTION_REACH + INTERACTION_PROXIMITY_PADDING;

  if (separation <= maxReach) {
    return true;
  }

  // Same AABB test as movement collision, with padding — covers axis-aligned approaches.
  return (
    Math.abs(playerX - hitbox.x) <=
      PLAYER_HALF_WIDTH + hitbox.halfWidth + INTERACTION_PROXIMITY_PADDING &&
    Math.abs(playerZ - hitbox.z) <=
      PLAYER_HALF_DEPTH + hitbox.halfDepth + INTERACTION_PROXIMITY_PADDING
  );
}

function distanceToHitboxCenter(playerPosition, hitbox) {
  const [playerX, , playerZ] = playerPosition;
  const dx = playerX - hitbox.x;
  const dz = playerZ - hitbox.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function findNearestInteractableAsset(playerPosition, placedAssets, getHitbox) {
  let nearestAsset = null;
  let nearestDistance = Infinity;

  for (const asset of placedAssets) {
    const hitbox = getHitbox(asset);

    if (!isPlayerInHitboxProximity(playerPosition, hitbox)) {
      continue;
    }

    const distance = distanceToHitboxCenter(playerPosition, hitbox);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestAsset = asset;
    }
  }

  return nearestAsset;
}

/** @deprecated Use buildSpaceExitNarrative for block-level spaces */
export function fillNarrativeBlanks(sceneText, actionHistory) {
  let result = sceneText;
  let historyIndex = 0;

  while (result.includes("___") && historyIndex < actionHistory.length) {
    result = result.replace("___", actionHistory[historyIndex].narrativeLine);
    historyIndex += 1;
  }

  const remainingLines = actionHistory
    .slice(historyIndex)
    .map((entry) => entry.narrativeLine);

  if (remainingLines.length === 0) {
    return result;
  }

  const suffix = remainingLines.join(" ");

  if (!result.trim()) {
    return suffix;
  }

  return `${result.trim()} ${suffix}`.trim();
}

export function createActionHistoryEntry(asset, action) {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    placedId: asset.placedId,
    assetName: asset.name,
    actionId: action.id,
    actionLabel: action.label,
    narrativeLine: buildNarrativeLine(action, asset.name),
    completesSpace: actionCompletesSpace(action),
  };
}
