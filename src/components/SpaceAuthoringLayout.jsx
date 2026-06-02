import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import IsometricRoom from "./IsometricRoom";
import PlacedAsset3D from "./PlacedAsset3D";
import Player from "./Player";
import InteractionOverlay from "./InteractionOverlay";
import PlacedAssetsPanel from "./PlacedAssetsPanel";
import SceneParsePanel from "./SceneParsePanel";

import { getSpacePassageFields } from "../models/document";
import { createAssetHitbox } from "../utils/hitbox";
import {
  createActionHistoryEntry,
  findNearestInteractableAsset,
  getDefaultInteractionsForCategory,
  getPlayableInteractions,
  getSpaceWinCondition,
  isWinConditionMet,
} from "../utils/interactions";
import { enrichParsedAssets, parseSceneExcerpt } from "../utils/parseSceneApi";
import { apiUrl } from "../utils/apiBase";
import { imageUrlToDataUrl } from "../utils/projectImages";

function SpaceAuthoringLayout({
  passage,
  space,
  onSpacePassageChange,
  onSpaceUpdate,
  embedded = false,
  onBack,
}) {
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  const [parseError, setParseError] = useState("");
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const [roomFocused, setRoomFocused] = useState(false);

  const {
    assetCandidates,
    selectedAssetId,
    placedAssets,
    selectedPlacedAssetId,
    playtestActionHistory,
    title,
    status,
  } = space;

  const selectedAsset = assetCandidates.find((asset) => asset.id === selectedAssetId);

  const { sceneText } = getSpacePassageFields(passage);
  const winCondition = getSpaceWinCondition(placedAssets);

  function patchSpace(updates) {
    onSpaceUpdate(passage.id, updates);
  }

  const nearbyInteractableAsset = useMemo(() => {
    if (embedded) return null;
    return findNearestInteractableAsset(
      playerPosition,
      placedAssets,
      createAssetHitbox
    );
  }, [embedded, playerPosition, placedAssets]);

  const nearbyInteractions = useMemo(() => {
    if (!nearbyInteractableAsset) return [];
    return getPlayableInteractions(nearbyInteractableAsset);
  }, [nearbyInteractableAsset]);

  async function parseScene() {
    if (!sceneText.trim()) return;

    setLoadingParse(true);
    setParseError("");

    try {
      const assets = await parseSceneExcerpt(sceneText);
      if (assets.length === 0) {
        patchSpace({ assetCandidates: [], selectedAssetId: null });
        setParseError("No objects found in the scene. Try naming specific items.");
        return;
      }

      const parsedAssets = enrichParsedAssets(assets);
      patchSpace({
        assetCandidates: parsedAssets,
        selectedAssetId: parsedAssets[0]?.id ?? null,
      });
    } catch (error) {
      console.error("Error parsing scene:", error);
      setParseError(
        error.message === "Failed to fetch"
          ? "Could not reach the server. Start it with: node server/index.js"
          : error.message
      );
    } finally {
      setLoadingParse(false);
    }
  }

  function updateSelectedAssetPrompt(newPrompt) {
    if (!selectedAsset) return;
    const updatedAsset = { ...selectedAsset, prompt: newPrompt };
    patchSpace({
      assetCandidates: assetCandidates.map((asset) =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      ),
      selectedAssetId: updatedAsset.id,
    });
  }

  async function generateSelectedAsset() {
    if (!selectedAsset) return;
    setLoadingAsset(true);

    try {
      const response = await fetch(apiUrl("/generate-asset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selectedAsset.prompt }),
      });
      const data = await response.json();
      let imageUrl = data.imageUrl;
      try {
        imageUrl = await imageUrlToDataUrl(data.imageUrl);
      } catch (error) {
        console.warn("Could not persist generated image locally:", error);
      }
      const generatedAsset = { ...selectedAsset, imageUrl };
      patchSpace({
        assetCandidates: assetCandidates.map((asset) =>
          asset.id === generatedAsset.id ? generatedAsset : asset
        ),
        selectedAssetId: generatedAsset.id,
      });
    } catch (error) {
      console.error("Error generating asset:", error);
    } finally {
      setLoadingAsset(false);
    }
  }

  function placeAsset(asset) {
    if (!asset.imageUrl) return;
    const offset = placedAssets.length * 0.35;
    const placedAsset = {
      ...asset,
      placedId: crypto.randomUUID(),
      x: -1 + offset,
      y: 0,
      z: 0 + offset,
      width: 2,
      height: 2,
      isSolid: true,
      isLocked: false,
      colliderScale: 0.9,
      hitboxWidthScale: 0.8,
      hitboxHeightScale: 0.8,
      hitboxDepthScale: 0.7,
      hitboxOffsetX: 0,
      hitboxOffsetY: 0,
      hitboxOffsetZ: 0,
      interactions: asset.interactions?.length
        ? asset.interactions
        : getDefaultInteractionsForCategory(asset.category),
    };

    patchSpace({
      placedAssets: [...placedAssets, placedAsset],
      selectedPlacedAssetId: placedAsset.placedId,
    });
  }

  function updatePlacedAssets(updater) {
    const next =
      typeof updater === "function" ? updater(placedAssets) : updater;
    patchSpace({ placedAssets: next });
  }

  function selectPlacedAsset(placedId) {
    patchSpace({ selectedPlacedAssetId: placedId });
  }

  function toggleAssetLock(placedId) {
    updatePlacedAssets((previous) =>
      previous.map((asset) =>
        asset.placedId === placedId ? { ...asset, isLocked: !asset.isLocked } : asset
      )
    );
  }

  function updatePlacedAsset(placedId, updates) {
    updatePlacedAssets((previous) =>
      previous.map((asset) => {
        if (asset.placedId !== placedId || asset.isLocked) return asset;
        return { ...asset, ...updates };
      })
    );
  }

  function updatePlacedAssetEvenIfLocked(placedId, updates) {
    updatePlacedAssets((previous) => {
      const hasNewWin =
        updates.interactions?.some((action) => action.completesSpace) ?? false;

      return previous.map((asset) => {
        if (asset.placedId === placedId) {
          return { ...asset, ...updates };
        }

        if (!hasNewWin || !asset.interactions?.length) {
          return asset;
        }

        return {
          ...asset,
          interactions: asset.interactions.map((action) => ({
            ...action,
            completesSpace: false,
          })),
        };
      });
    });
  }

  function removePlacedAsset(placedId) {
    updatePlacedAssets((previous) =>
      previous.filter((asset) => asset.placedId !== placedId)
    );
    if (selectedPlacedAssetId === placedId) {
      patchSpace({ selectedPlacedAssetId: null });
    }
  }

  const collisionObjects = useMemo(() => {
    return placedAssets
      .filter((asset) => asset.isSolid)
      .map((asset) => createAssetHitbox(asset));
  }, [placedAssets]);

  function performInteraction(action) {
    if (!nearbyInteractableAsset) return;
    const historyEntry = createActionHistoryEntry(
      nearbyInteractableAsset,
      action
    );
    const nextHistory = [...playtestActionHistory, historyEntry];
    patchSpace({ playtestActionHistory: nextHistory });

    if (isWinConditionMet(nextHistory, placedAssets)) {
      patchSpace({ status: "ready" });
    }
  }

  return (
    <div
      className={`space-authoring-layout ${embedded ? "space-authoring-layout-embedded" : ""}`}
    >
      <div className="space-authoring-header">
        {!embedded && onBack && (
          <button type="button" className="secondary-button" onClick={onBack}>
            ← Back to manuscript
          </button>
        )}
        <input
          className="space-title-input"
          value={title}
          onChange={(event) => patchSpace({ title: event.target.value })}
          aria-label="Space title"
        />
        <label className="space-status-label">
          Status
          <select
            value={status}
            onChange={(event) => patchSpace({ status: event.target.value })}
          >
            <option value="draft">draft</option>
            <option value="ready">ready</option>
          </select>
        </label>
      </div>

      <div className="space-authoring-main">
        <div className="space-room-column">
          <section className="room-panel panel space-room-panel">
            <h2>Isometric room</h2>
            <div
              className="room-canvas"
              tabIndex={embedded ? undefined : -1}
              onPointerDown={
                embedded
                  ? undefined
                  : () => {
                      setRoomFocused(true);
                    }
              }
            >
              <Canvas
                orthographic
                frameloop="always"
                camera={{
                  position: [6, 6, 6],
                  zoom: 42,
                  near: 0.1,
                  far: 1000,
                }}
              >
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 8, 5]} intensity={1} />

                <group position={[0, -2, 0]}>
                  <IsometricRoom />
                  {placedAssets.map((asset) => (
                    <PlacedAsset3D
                      key={asset.placedId}
                      asset={asset}
                      isSelected={selectedPlacedAssetId === asset.placedId}
                      isLocked={asset.isLocked}
                      onSelect={() => selectPlacedAsset(asset.placedId)}
                      onUpdate={(updates) =>
                        updatePlacedAsset(asset.placedId, updates)
                      }
                    />
                  ))}
                  {!embedded && (
                    <Player
                      collisionObjects={collisionObjects}
                      onPositionChange={setPlayerPosition}
                      inputEnabled={roomFocused}
                    />
                  )}
                </group>
              </Canvas>
            </div>
          </section>

          {embedded ? (
            <section className="panel interaction-panel space-interaction-panel">
              <h2>Playtest</h2>
              <p className="control-hint interaction-panel-placeholder">
                Open Preview, choose your space passage, click Enter scene, then
                walk and interact there. This room is for placing and editing
                objects.
              </p>
            </section>
          ) : (
            <section className="panel interaction-panel space-interaction-panel">
              <h2>Playtest</h2>
              {winCondition && (
                <p className="control-hint interaction-win-hint">
                  Win: {winCondition.actionLabel} on {winCondition.assetName}
                </p>
              )}
              <div className="interaction-panel-content">
                {nearbyInteractableAsset && nearbyInteractions.length > 0 ? (
                  <InteractionOverlay
                    asset={nearbyInteractableAsset}
                    actions={nearbyInteractions}
                    onPerformAction={performInteraction}
                  />
                ) : (
                  <p className="empty interaction-panel-placeholder">
                    Click the room, then walk near a placed object (arrow keys or
                    WASD).
                  </p>
                )}
              </div>
              {playtestActionHistory.length > 0 && (
                <ol className="space-playtest-lines">
                  {playtestActionHistory.map((entry) => (
                    <li key={entry.id}>{entry.narrativeLine}</li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <aside className="space-sidebar">
          <SceneParsePanel
            sceneText={sceneText}
            onSceneTextChange={(text) =>
              onSpacePassageChange(passage.id, { sceneText: text })
            }
            onParse={parseScene}
            loadingParse={loadingParse}
            parseError={parseError}
            assetCandidates={assetCandidates}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => patchSpace({ selectedAssetId: id })}
            placedAssets={placedAssets}
          />

          <section className="panel selected-asset-panel">
            <h2>Selected asset</h2>
            {selectedAsset ? (
              <div className="asset-editor">
                <p className="asset-name">{selectedAsset.name}</p>
                <p className="asset-category">{selectedAsset.category}</p>
                <label>Asset prompt</label>
                <textarea
                  value={selectedAsset.prompt}
                  onChange={(event) =>
                    updateSelectedAssetPrompt(event.target.value)
                  }
                  rows={5}
                />
                <button
                  className="button-bottom-margin"
                  onClick={generateSelectedAsset}
                  disabled={loadingAsset}
                >
                  {loadingAsset ? "Generating..." : "Generate / Regenerate"}
                </button>
                {selectedAsset.imageUrl && (
                  <>
                    <img
                      src={selectedAsset.imageUrl}
                      alt={selectedAsset.name}
                      className="asset-preview"
                    />
                    <button
                      type="button"
                      className="place-button"
                      onClick={() => placeAsset(selectedAsset)}
                    >
                      Place in room
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="empty">Parse the scene above, then select an object.</p>
            )}
          </section>

          <section className="panel placed-assets-panel space-sidebar-placed">
            <PlacedAssetsPanel
              placedAssets={placedAssets}
              selectedPlacedAssetId={selectedPlacedAssetId}
              onSelectPlacedAsset={selectPlacedAsset}
              onToggleLock={toggleAssetLock}
              onUpdatePlacedAsset={updatePlacedAsset}
              onUpdatePlacedAssetEvenIfLocked={updatePlacedAssetEvenIfLocked}
              onRemovePlacedAsset={removePlacedAsset}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default SpaceAuthoringLayout;
