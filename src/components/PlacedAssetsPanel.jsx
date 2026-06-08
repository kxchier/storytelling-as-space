import InteractionActionsEditor from "./InteractionActionsEditor";

function PlacedAssetsPanel({
  placedAssets,
  selectedPlacedAssetId,
  onSelectPlacedAsset,
  onToggleLock,
  onUpdatePlacedAsset,
  onUpdatePlacedAssetEvenIfLocked,
  onRemovePlacedAsset,
}) {
  return (
    <>
      <h2>Staged props</h2>

      {placedAssets.length === 0 ? (
        <p className="empty">Staged props will appear here.</p>
      ) : (
        <div className="placed-list">
          {placedAssets.map((asset) => (
            <article
              key={asset.placedId}
              className={
                selectedPlacedAssetId === asset.placedId
                  ? `placed-control-card selected ${
                      asset.isLocked ? "locked" : ""
                    }`
                  : `placed-control-card ${asset.isLocked ? "locked" : ""}`
              }
              onClick={() => onSelectPlacedAsset(asset.placedId)}
            >
              <div className="placed-card-header">
                <p>{asset.name}</p>

                {asset.isLocked && <span className="lock-badge">Locked</span>}
              </div>

              {selectedPlacedAssetId === asset.placedId && (
                <div className="hitbox-controls">
                  <p className="control-hint">
                    {asset.isLocked
                      ? "This prop is locked. Unlock it to move or edit it."
                      : "Drag the prop on stage to move it."}
                  </p>

                  <button
                    className="secondary-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLock(asset.placedId);
                    }}
                  >
                    {asset.isLocked ? "🔓 Unlock prop" : "🔒 Lock prop"}
                  </button>

                  <div className="hitbox-toggle-row">
                    <label className="control-hint cozy-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(asset.isSolid)}
                        disabled={asset.isLocked}
                        onChange={(event) =>
                          onUpdatePlacedAsset(asset.placedId, {
                            isSolid: event.target.checked,
                          })
                        }
                        onClick={(event) => event.stopPropagation()}
                      />{" "}
                      Blocking
                    </label>
                  </div>

                  <InteractionActionsEditor
                    assetName={asset.name}
                    interactions={asset.interactions}
                    disabled={asset.isLocked}
                    onChange={(interactions) =>
                      onUpdatePlacedAssetEvenIfLocked(asset.placedId, {
                        interactions,
                      })
                    }
                  />

                  <div className="hitbox-group">
                    <p className="hitbox-group-title">Size</p>

                    <label className="control-hint slider-label">
                      Hitbox Size
                      <span>
                        {Math.round((asset.colliderScale ?? 0.75) * 100)}%
                      </span>
                    </label>
                    <input
                      className="cozy-slider"
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={asset.colliderScale ?? 0.75}
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
                          colliderScale: Number(event.target.value),
                        })
                      }
                      onClick={(event) => event.stopPropagation()}
                    />

                    <label className="control-hint slider-label">
                      Width
                      <span>
                        {Math.round((asset.hitboxWidthScale ?? 0.8) * 100)}%
                      </span>
                    </label>
                    <input
                      className="cozy-slider"
                      type="range"
                      min="0.3"
                      max="1.4"
                      step="0.05"
                      value={asset.hitboxWidthScale ?? 0.8}
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
                          hitboxWidthScale: Number(event.target.value),
                        })
                      }
                      onClick={(event) => event.stopPropagation()}
                    />

                    <label className="control-hint slider-label">
                      Height
                      <span>
                        {Math.round((asset.hitboxHeightScale ?? 1) * 100)}%
                      </span>
                    </label>
                    <input
                      className="cozy-slider"
                      type="range"
                      min="0.3"
                      max="1.5"
                      step="0.05"
                      value={asset.hitboxHeightScale ?? 1}
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
                          hitboxHeightScale: Number(event.target.value),
                        })
                      }
                      onClick={(event) => event.stopPropagation()}
                    />

                    <label className="control-hint slider-label">
                      Depth
                      <span>
                        {Math.round((asset.hitboxDepthScale ?? 0.6) * 100)}%
                      </span>
                    </label>
                    <input
                      className="cozy-slider"
                      type="range"
                      min="0.3"
                      max="1.4"
                      step="0.05"
                      value={asset.hitboxDepthScale ?? 0.6}
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
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
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
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
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
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
                      disabled={asset.isLocked}
                      onChange={(event) =>
                        onUpdatePlacedAsset(asset.placedId, {
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
                      onRemovePlacedAsset(asset.placedId);
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
    </>
  );
}

export default PlacedAssetsPanel;
