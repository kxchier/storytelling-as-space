const DEFAULT_INTERACTIONS_BY_CATEGORY = {
  furniture: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She studied the {name}, taking in every worn detail.",
    },
    {
      id: "touch",
      label: "Touch",
      narrativeTemplate: "She rested her hand on the {name}.",
    },
    {
      id: "lean",
      label: "Lean against",
      narrativeTemplate: "She leaned against the {name} for a moment.",
    },
  ],
  object: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She turned the {name} over in her hands.",
    },
    {
      id: "pick-up",
      label: "Pick up",
      narrativeTemplate: "She picked up the {name}.",
    },
    {
      id: "use",
      label: "Use",
      narrativeTemplate: "She used the {name}, careful and deliberate.",
    },
  ],
  decor: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She looked closely at the {name}.",
    },
    {
      id: "adjust",
      label: "Straighten",
      narrativeTemplate: "She nudged the {name} into a neater place.",
    },
  ],
  architecture: [
    {
      id: "look-through",
      label: "Look through",
      narrativeTemplate: "She gazed through the {name}, lost in thought.",
    },
    {
      id: "listen",
      label: "Listen",
      narrativeTemplate: "She listened at the {name}.",
    },
  ],
  lighting: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "The {name} cast a soft glow across her face.",
    },
    {
      id: "adjust",
      label: "Adjust",
      narrativeTemplate: "She adjusted the {name} until the light felt right.",
    },
  ],
  nature: [
    {
      id: "examine",
      label: "Examine",
      narrativeTemplate: "She brushed a finger along the {name}.",
    },
    {
      id: "tend",
      label: "Tend to",
      narrativeTemplate: "She tended to the {name} with quiet care.",
    },
  ],
};

const FALLBACK_INTERACTIONS = DEFAULT_INTERACTIONS_BY_CATEGORY.object;

const PROXIMITY_PLAYER_RADIUS = 0.28;

export function getDefaultInteractionsForCategory(category) {
  return (
    DEFAULT_INTERACTIONS_BY_CATEGORY[category] ?? FALLBACK_INTERACTIONS
  ).map((action) => ({ ...action }));
}

export function getInteractionsForAsset(asset) {
  if (asset.interactions?.length) {
    return asset.interactions;
  }

  return getDefaultInteractionsForCategory(asset.category);
}

export function getPlayableInteractions(asset) {
  return getInteractionsForAsset(asset).filter((action) =>
    Boolean(action.label?.trim())
  );
}

export function createInteractionAction({
  label = "",
  narrativeTemplate = "She interacted with the {name}.",
} = {}) {
  return {
    id: crypto.randomUUID(),
    label,
    narrativeTemplate,
  };
}

export function buildNarrativeLine(action, assetName) {
  const template =
    action.narrativeTemplate?.trim() ||
    `She chose to ${action.label.toLowerCase()} the {name}.`;

  return template.replace(/\{name\}/g, assetName);
}

export function isPlayerInHitboxProximity(playerPosition, hitbox) {
  const [playerX, , playerZ] = playerPosition;

  return (
    Math.abs(playerX - hitbox.x) <= PROXIMITY_PLAYER_RADIUS + hitbox.halfWidth &&
    Math.abs(playerZ - hitbox.z) <= PROXIMITY_PLAYER_RADIUS + hitbox.halfDepth
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
  };
}
