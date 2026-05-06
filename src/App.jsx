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
                  onClick={() => selectPlacedAsset(asset.placedId)}
                >
                  <p>{asset.name}</p>

                  {selectedPlacedAssetId === asset.placedId && (
                    <>
                      <p className="control-hint">
                        Drag the asset in the room to move it.
                      </p>

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