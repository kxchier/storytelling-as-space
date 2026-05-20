import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import IsometricRoom from "./components/IsometricRoom";
import PlacedAsset3D from "./components/PlacedAsset3D";
import Player from "./components/Player";
import InteractionOverlay from "./components/InteractionOverlay";
import ActionHistoryPanel from "./components/ActionHistoryPanel";
import PlacedAssetsPanel from "./components/PlacedAssetsPanel";

import { createAssetHitbox } from "./utils/hitbox";
import {
  createActionHistoryEntry,
  fillNarrativeBlanks,
  findNearestInteractableAsset,
  getDefaultInteractionsForCategory,
  getPlayableInteractions,
} from "./utils/interactions";

import "./App.css";

function App() {
  const [sceneText, setSceneText] = useState(
    "She dropped her school bag beside the desk. Rain tapped against the window. A mug of tea sat near a stack of books."
  );

  const [assetCandidates, setAssetCandidates] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetLibrary, setAssetLibrary] = useState([]);
  const [placedAssets, setPlacedAssets] = useState([]);
  const [selectedPlacedAssetId, setSelectedPlacedAssetId] = useState(null);

  const [loadingAsset, setLoadingAsset] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  const [parseError, setParseError] = useState("");
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const [actionHistory, setActionHistory] = useState([]);

  const selectedPlacedAsset = placedAssets.find(
    (asset) => asset.placedId === selectedPlacedAssetId
  );

  const nearbyInteractableAsset = useMemo(() => {
    return findNearestInteractableAsset(
      playerPosition,
      placedAssets,
      createAssetHitbox
    );
  }, [playerPosition, placedAssets]);

  const nearbyInteractions = useMemo(() => {
    if (!nearbyInteractableAsset) {
      return [];
    }

    return getPlayableInteractions(nearbyInteractableAsset);
  }, [nearbyInteractableAsset]);

  const livingNarrative = useMemo(() => {
    return fillNarrativeBlanks(sceneText, actionHistory);
  }, [sceneText, actionHistory]);

  async function parseScene() {
    if (!sceneText.trim()) return;

    setLoadingParse(true);
    setParseError("");

    try {
      const response = await fetch("http://localhost:3001/parse-scene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sceneText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to parse scene");
      }

      if (!Array.isArray(data.assets)) {
        throw new Error("Parser returned an invalid response");
      }

      if (data.assets.length === 0) {
        setAssetCandidates([]);
        setSelectedAsset(null);
        setParseError("No objects found in scene text. Try naming specific items.");
        return;
      }

      const parsedAssets = data.assets.map((asset) => ({
        id: crypto.randomUUID(),
        name: asset.name,
        category: asset.category,
        placementType: asset.placementType ?? "sprite",
        prompt: asset.prompt,
        interactions: getDefaultInteractionsForCategory(asset.category),
      }));

      setAssetCandidates(parsedAssets);
      setSelectedAsset(parsedAssets[0] ?? null);
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

    const updatedAsset = {
      ...selectedAsset,
      prompt: newPrompt,
    };

    setSelectedAsset(updatedAsset);

    setAssetCandidates((previousCandidates) =>
      previousCandidates.map((asset) =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      )
    );

    setAssetLibrary((previousLibrary) =>
      previousLibrary.map((asset) =>
        asset.id === updatedAsset.id ? updatedAsset : asset
      )
    );
  }

  async function generateSelectedAsset() {
    if (!selectedAsset) return;

    setLoadingAsset(true);

    try {
      const response = await fetch("http://localhost:3001/generate-asset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: selectedAsset.prompt,
        }),
      });

      const data = await response.json();

      const generatedAsset = {
        ...selectedAsset,
        imageUrl: data.imageUrl,
      };

      setSelectedAsset(generatedAsset);

      setAssetCandidates((previousCandidates) =>
        previousCandidates.map((asset) =>
          asset.id === generatedAsset.id ? generatedAsset : asset
        )
      );

      setAssetLibrary((previousLibrary) => {
        const alreadyExists = previousLibrary.some(
          (asset) => asset.id === generatedAsset.id
        );

        if (alreadyExists) {
          return previousLibrary.map((asset) =>
            asset.id === generatedAsset.id ? generatedAsset : asset
          );
        }

        return [...previousLibrary, generatedAsset];
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

      interactions:
        asset.interactions ??
        getDefaultInteractionsForCategory(asset.category),
    };

    setPlacedAssets((previousPlacedAssets) => [
      ...previousPlacedAssets,
      placedAsset,
    ]);

    setSelectedPlacedAssetId(placedAsset.placedId);
  }

  function selectPlacedAsset(placedId) {
    setSelectedPlacedAssetId(placedId);
  }

  function toggleAssetLock(placedId) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.map((asset) =>
        asset.placedId === placedId
          ? {
              ...asset,
              isLocked: !asset.isLocked,
            }
          : asset
      )
    );
  }

  function updatePlacedAsset(placedId, updates) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.map((asset) => {
        if (asset.placedId !== placedId) {
          return asset;
        }

        if (asset.isLocked) {
          return asset;
        }

        return {
          ...asset,
          ...updates,
        };
      })
    );
  }

  function updatePlacedAssetEvenIfLocked(placedId, updates) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.map((asset) =>
        asset.placedId === placedId
          ? {
              ...asset,
              ...updates,
            }
          : asset
      )
    );
  }

  function removePlacedAsset(placedId) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.filter((asset) => asset.placedId !== placedId)
    );

    if (selectedPlacedAssetId === placedId) {
      setSelectedPlacedAssetId(null);
    }
  }

  const collisionObjects = useMemo(() => {
    return placedAssets
      .filter((asset) => asset.isSolid)
      .map((asset) => createAssetHitbox(asset));
  }, [placedAssets]);

  function performInteraction(action) {
    if (!nearbyInteractableAsset) {
      return;
    }

    const historyEntry = createActionHistoryEntry(
      nearbyInteractableAsset,
      action
    );

    setActionHistory((previousHistory) => [...previousHistory, historyEntry]);
  }

  function clearActionHistory() {
    setActionHistory([]);
  }

  return (
    <main className="app">
      <header>
        <h1 className="app-title">Storytelling as Space</h1>
      </header>

      <div className="workspace">
        <div className="left-panel">
          <section className="panel scene-panel">
            <h2>Scene Text</h2>

            <textarea
              value={sceneText}
              onChange={(event) => setSceneText(event.target.value)}
              rows={7}
            />

            <button
              className="button-bottom-margin"
              onClick={parseScene}
              disabled={loadingParse}
            >
              {loadingParse ? "Parsing..." : "Parse Scene"}
            </button>

            {parseError && <p className="parse-error">{parseError}</p>}

            <h2 className="section-divider-heading">Asset Candidates</h2>

            {assetCandidates.length === 0 ? (
              <p className="empty">No assets parsed yet.</p>
            ) : (
              <div className="candidate-list">
                {assetCandidates.map((asset) => (
                  <button
                    key={asset.id}
                    className={
                      selectedAsset?.id === asset.id
                        ? "candidate-pill selected"
                        : "candidate-pill"
                    }
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel story-panel">
            <ActionHistoryPanel
              actionHistory={actionHistory}
              livingNarrative={livingNarrative}
              onClearHistory={clearActionHistory}
            />
          </section>
        </div>

        <div className="center-panel">
          <section className="room-panel panel">
            <h2>Isometric Room</h2>

            <div className="room-canvas">
            <Canvas
              orthographic
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

                <Player
                  collisionObjects={collisionObjects}
                  onPositionChange={setPlayerPosition}
                />
              </group>
            </Canvas>
          </div>
          </section>

          <section className="panel interaction-panel">
            <h2>Interact</h2>

            <div className="interaction-panel-content">
              {nearbyInteractableAsset && nearbyInteractions.length > 0 ? (
                <InteractionOverlay
                  asset={nearbyInteractableAsset}
                  actions={nearbyInteractions}
                  onPerformAction={performInteraction}
                />
              ) : (
                <p className="empty interaction-panel-placeholder">
                  Walk near a placed object to see actions.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="right-panel">
          <section className="panel selected-asset-panel">
            <h2>Selected Asset</h2>

            {selectedAsset ? (
              <div className="asset-editor">
                <p className="asset-name">{selectedAsset.name}</p>
                <p className="asset-category">{selectedAsset.category}</p>

                <label>Asset Prompt</label>

                <textarea
                  value={selectedAsset.prompt}
                  onChange={(event) =>
                    updateSelectedAssetPrompt(event.target.value)
                  }
                  rows={6}
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
                      className="place-button"
                      onClick={() => placeAsset(selectedAsset)}
                    >
                      Place in Room
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="empty">Click an asset candidate.</p>
            )}
          </section>

          <section className="panel placed-assets-panel">
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
        </div>
      </div>
    </main>
  );
}

export default App;
