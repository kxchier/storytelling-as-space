import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import IsometricRoom from "./components/IsometricRoom";
import PlacedAsset3D from "./components/PlacedAsset3d";
import Player from "./components/Player";

import "./App.css";

function App() {
  const [sceneText, setSceneText] = useState(
    "She dropped her school bag beside the desk. Rain tapped against the window. A mug of tea sat near a stack of books."
  );

  const [floorPrompt, setFloorPrompt] = useState(
    "Warm wooden floor texture, illustrated game style"
  );
  
  const [wallPrompt, setWallPrompt] = useState(
    "Soft cream wallpaper texture, illustrated game style"
  );

  const [floorTextureUrl, setFloorTextureUrl] = useState("");
  const [wallTextureUrl, setWallTextureUrl] = useState("");

  const [assetCandidates, setAssetCandidates] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetLibrary, setAssetLibrary] = useState([]);
  const [placedAssets, setPlacedAssets] = useState([]);
  const [selectedPlacedAssetId, setSelectedPlacedAssetId] = useState(null);

  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  async function generateRoomTextures() {
    setLoadingRoom(true);
  
    try {
      const floorResponse = await fetch("http://localhost:3001/generate-texture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: floorPrompt,
        }),
      });
  
      const wallResponse = await fetch("http://localhost:3001/generate-texture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: wallPrompt,
        }),
      });
  
      const floorData = await floorResponse.json();
      const wallData = await wallResponse.json();
  
      setFloorTextureUrl(floorData.imageUrl);
      setWallTextureUrl(wallData.imageUrl);
    } catch (error) {
      console.error("Error generating room textures:", error);
    } finally {
      setLoadingRoom(false);
    }
  }

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
    };
  
    setPlacedAssets((previousPlacedAssets) => [
      ...previousPlacedAssets,
      placedAsset,
    ]);
  
    setSelectedPlacedAssetId(placedAsset.placedId);
  }

  function movePlacedAsset(placedId, direction) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.map((asset) => {
        if (asset.placedId !== placedId) return asset;

        const step = 0.25;

        if (direction === "left") {
          return { ...asset, x: asset.x - step };
        }

        if (direction === "right") {
          return { ...asset, x: asset.x + step };
        }

        if (direction === "up") {
          return { ...asset, z: asset.z - step };
        }

        if (direction === "down") {
          return { ...asset, z: asset.z + step };
        }

        return asset;
      })
    );
  }

  function resizePlacedAsset(placedId, amount) {
    setPlacedAssets((previousPlacedAssets) =>
      previousPlacedAssets.map((asset) => {
        if (asset.placedId !== placedId) return asset;

        return {
          ...asset,
          width: Math.max(0.3, asset.width + amount),
          height: Math.max(0.3, asset.height + amount),
        };
      })
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

          <h2>Floor Texture Prompt</h2>
          <textarea
            value={floorPrompt}
            onChange={(event) => setFloorPrompt(event.target.value)}
            rows={4}
          />

          <h2>Wall Texture Prompt</h2>

          <textarea
            value={wallPrompt}
            onChange={(event) => setWallPrompt(event.target.value)}
            rows={4}
          />

          <button onClick={generateRoomTextures} disabled={loadingRoom}>
            {loadingRoom ? "Generating Textures..." : "Generate Floor + Wall Textures"}
          </button>

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
              <IsometricRoom
                floorTextureUrl={floorTextureUrl}
                wallTextureUrl={wallTextureUrl}
              />

              {placedAssets.map((asset) => (
                <PlacedAsset3D key={asset.placedId} asset={asset} />
              ))}

              <Player />
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
                onClick={() => setSelectedPlacedAssetId(asset.placedId)}
              >
                <p>{asset.name}</p>

                {selectedPlacedAssetId === asset.placedId && (
                  <>
                    <div className="control-row">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          movePlacedAsset(asset.placedId, "left");
                        }}
                      >
                        ←
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          movePlacedAsset(asset.placedId, "up");
                        }}
                      >
                        ↑
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          movePlacedAsset(asset.placedId, "down");
                        }}
                      >
                        ↓
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          movePlacedAsset(asset.placedId, "right");
                        }}
                      >
                        →
                      </button>
                    </div>

                    <div className="control-row">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          resizePlacedAsset(asset.placedId, -0.1);
                        }}
                      >
                        Smaller
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          resizePlacedAsset(asset.placedId, 0.1);
                        }}
                      >
                        Bigger
                      </button>
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
                  </>
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