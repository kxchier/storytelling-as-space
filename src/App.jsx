import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import IsometricRoom from "./components/IsometricRoom";
import PlacedAsset3D from "./components/PlacedAsset3D";
import Player from "./components/Player";

import "./App.css";

const MIN_SOLID_HITBOX_SCALE = 0.6;

function createAssetHitbox(asset) {
  const colliderScale = asset.colliderScale ?? 0.75;
  const baseWidthScale = asset.hitboxWidthScale ?? 0.8;
  const hitboxHeightScale = asset.hitboxHeightScale ?? 1;
  const baseDepthScale = asset.hitboxDepthScale ?? 0.6;
  const hitboxWidthScale = asset.isSolid
    ? Math.max(baseWidthScale, MIN_SOLID_HITBOX_SCALE)
    : baseWidthScale;
  const hitboxDepthScale = asset.isSolid
    ? Math.max(baseDepthScale, MIN_SOLID_HITBOX_SCALE)
    : baseDepthScale;
  const hitboxOffsetX = asset.hitboxOffsetX ?? 0;
  const hitboxOffsetY = asset.hitboxOffsetY ?? 0;
  const hitboxOffsetZ = asset.hitboxOffsetZ ?? 0;
  const hitboxWidth = asset.width * colliderScale * hitboxWidthScale;
  const hitboxHeight = asset.height * colliderScale * hitboxHeightScale;
  const hitboxDepth = asset.width * colliderScale * hitboxDepthScale;

  return {
    id: asset.placedId,
    x: asset.x + hitboxOffsetX,
    y: asset.y + hitboxHeight / 2 + hitboxOffsetY,
    z: asset.z + hitboxOffsetZ,
    halfWidth: hitboxWidth / 2,
    halfHeight: hitboxHeight / 2,
    halfDepth: hitboxDepth / 2,
  };
}

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

  function parseScene() {
    const parsedAssets = [
      {
        id: crypto.randomUUID(),
        name: "school bag",
        category: "object",
        placementType: "sprite",
        prompt:
          "A single isolated isometric 2D game asset of a navy school bag, 3/4 top-down view, front-facing isometric sprite, cozy illustrated style, transparent background, no white background, no floor, no wall, no room",
      },
      {
        id: crypto.randomUUID(),
        name: "desk",
        category: "furniture",
        placementType: "floor",
        prompt:
          "A single isolated isometric 2D game asset of a wooden student desk, 3/4 top-down view, front-facing isometric sprite, cozy illustrated style, transparent background, no white background, no floor, no wall, no room",
      },
      {
        id: crypto.randomUUID(),
        name: "mug of tea",
        category: "object",
        placementType: "sprite",
        prompt:
          "A single isolated isometric 2D game asset of a warm mug of tea, 3/4 top-down view, front-facing isometric sprite, cozy illustrated style, transparent background, no white background, no floor, no wall, no room",
      },
    ];

    setAssetCandidates(parsedAssets);
    setSelectedAsset(parsedAssets[0]);
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
      y: 0.05,
      z: 0 + offset,
      width: 2.4,
      height: 2.4,
      isSolid: true,
      colliderScale: 0.75,
      hitboxWidthScale: asset.category === "furniture" ? 1 : 0.8,
      hitboxHeightScale: 1,
      hitboxDepthScale: asset.category === "furniture" ? 1 : 0.6,
      hitboxOffsetX: 0,
      hitboxOffsetY: 0,
      hitboxOffsetZ: 0,
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

  function updatePlacedAsset(placedId, updates) {
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

  const collisionObjects = useMemo(() => {
    return placedAssets
      .filter((asset) => asset.isSolid)
      .map((asset) => createAssetHitbox(asset));
  }, [placedAssets]);

  function removePlacedAsset(placedId) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.filter((asset) => asset.placedId !== placedId)
    );

    if (selectedPlacedAssetId === placedId) {
      setSelectedPlacedAssetId(null);
    }
  }

  return (
    <main className="app">
      <header>
        <h1 className="app-title">Storytelling as Space</h1>
      </header>

      <div className="workspace">
        <section className="left-panel panel">
          <h2>Scene Text</h2>

          <textarea
            value={sceneText}
            onChange={(event) => setSceneText(event.target.value)}
            rows={7}
          />

          <button onClick={parseScene}>Parse Scene</button>

          <h2>Asset Candidates</h2>

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
                    onSelect={() => selectPlacedAsset(asset.placedId)}
                    onUpdate={(updates) =>
                      updatePlacedAsset(asset.placedId, updates)
                    }
                  />
                ))}

                <Player collisionObjects={collisionObjects} />
              </group>
            </Canvas>
          </div>

          <h2>Placed Assets</h2>

          {placedAssets.length === 0 ? (
            <p className="empty">Placed assets will appear here.</p>
          ) : (
            <div className="placed-list">
              {placedAssets.map((asset) => (
                <article
                  key={asset.placedId}
                  className={
                    selectedPlacedAssetId === asset.placedId
                      ? "placed-control-card selected"
                      : "placed-control-card"
                  }
                  onClick={() => selectPlacedAsset(asset.placedId)}
                >
                  <p>{asset.name}</p>

                  {selectedPlacedAssetId === asset.placedId && (
                    <div className="hitbox-controls">
                      <p className="control-hint">
                        Drag the asset in the room to move it.
                      </p>

                      <div className="hitbox-toggle-row">
                        <label className="control-hint cozy-checkbox-label">
                          <input
                            type="checkbox"
                            checked={Boolean(asset.isSolid)}
                            onChange={(event) =>
                              updatePlacedAsset(asset.placedId, {
                                isSolid: event.target.checked,
                              })
                            }
                            onClick={(event) => event.stopPropagation()}
                          />{" "}
                          Collidable
                        </label>
                      </div>

                      <div className="hitbox-group">
                        <p className="hitbox-group-title">Size</p>

                        <label className="control-hint slider-label">
                          Hitbox Size
                          <span>{Math.round((asset.colliderScale ?? 0.75) * 100)}%</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="0.4"
                          max="1"
                          step="0.05"
                          value={asset.colliderScale ?? 0.75}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              colliderScale: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />

                        <label className="control-hint slider-label">
                          Width
                          <span>{Math.round((asset.hitboxWidthScale ?? 0.8) * 100)}%</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="0.3"
                          max="1.4"
                          step="0.05"
                          value={asset.hitboxWidthScale ?? 0.8}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxWidthScale: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />

                        <label className="control-hint slider-label">
                          Height
                          <span>{Math.round((asset.hitboxHeightScale ?? 1) * 100)}%</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="0.3"
                          max="1.5"
                          step="0.05"
                          value={asset.hitboxHeightScale ?? 1}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxHeightScale: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />

                        <label className="control-hint slider-label">
                          Depth
                          <span>{Math.round((asset.hitboxDepthScale ?? 0.6) * 100)}%</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="0.3"
                          max="1.4"
                          step="0.05"
                          value={asset.hitboxDepthScale ?? 0.6}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxDepthScale: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      </div>

                      <div className="hitbox-group">
                        <p className="hitbox-group-title">Position</p>

                        <label className="control-hint slider-label">
                          Offset X
                          <span>{(asset.hitboxOffsetX ?? 0).toFixed(2)}</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="-1.5"
                          max="1.5"
                          step="0.05"
                          value={asset.hitboxOffsetX ?? 0}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxOffsetX: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />

                        <label className="control-hint slider-label">
                          Offset Y
                          <span>{(asset.hitboxOffsetY ?? 0).toFixed(2)}</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="-1"
                          max="1.5"
                          step="0.05"
                          value={asset.hitboxOffsetY ?? 0}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxOffsetY: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />

                        <label className="control-hint slider-label">
                          Offset Z
                          <span>{(asset.hitboxOffsetZ ?? 0).toFixed(2)}</span>
                        </label>
                        <input
                          className="cozy-slider"
                          type="range"
                          min="-1.5"
                          max="1.5"
                          step="0.05"
                          value={asset.hitboxOffsetZ ?? 0}
                          onChange={(event) =>
                            updatePlacedAsset(asset.placedId, {
                              hitboxOffsetZ: Number(event.target.value),
                            })
                          }
                          onClick={(event) => event.stopPropagation()}
                        />
                      </div>

                      <button
                        className="secondary-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removePlacedAsset(asset.placedId);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="right-panel panel">
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

              <button onClick={generateSelectedAsset} disabled={loadingAsset}>
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

          <h2>Asset Library</h2>

          {assetLibrary.length === 0 ? (
            <p className="empty">Generated assets will appear here.</p>
          ) : (
            <div className="library-grid">
              {assetLibrary.map((asset) => (
                <article key={asset.id} className="library-card">
                  <img src={asset.imageUrl} alt={asset.name} />
                  <p>{asset.name}</p>

                  <button onClick={() => setSelectedAsset(asset)}>Edit</button>
                  <button onClick={() => placeAsset(asset)}>Place</button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;