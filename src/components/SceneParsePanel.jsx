import { getSpaceWinCondition } from "../utils/interactions";

function SceneParsePanel({
  sceneText,
  onSceneTextChange,
  onParse,
  loadingParse,
  parseError,
  assetCandidates,
  selectedAssetId,
  onSelectAsset,
  placedAssets,
}) {
  const winCondition = getSpaceWinCondition(placedAssets);

  return (
    <section className="panel scene-parse-panel">
      <h2>Scene</h2>
      <p className="control-hint">
        What the reader steps into — write entrance prose in the fixed passage above.
        Replaced on exit by performance lines.
      </p>

      <textarea
        className="manuscript-textarea manuscript-textarea-scene"
        value={sceneText}
        onChange={(event) => onSceneTextChange(event.target.value)}
        rows={4}
        placeholder="The seats were empty except for a forgotten scarf..."
      />

      <button
        type="button"
        className="scene-parse-button"
        onClick={onParse}
        disabled={loadingParse}
      >
        {loadingParse ? "Extracting..." : "Extract props"}
      </button>

      {parseError && <p className="parse-error">{parseError}</p>}

      {assetCandidates.length > 0 && (
        <>
          <p className="control-hint scene-parse-objects-label">Props in prose</p>
          <div className="candidate-list scene-parse-candidates">
            {assetCandidates.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className={
                  selectedAssetId === asset.id
                    ? "candidate-pill selected"
                    : "candidate-pill"
                }
                onClick={() => onSelectAsset(asset.id)}
                title={asset.name}
              >
                {asset.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="scene-parse-win">
        {winCondition ? (
          <p className="scene-win-set">
            Exit cue: <strong>{winCondition.actionLabel}</strong> on{" "}
            <strong>{winCondition.assetName}</strong>
          </p>
        ) : (
          <p className="empty scene-win-unset">
            Mark one cue as &ldquo;Exit cue&rdquo; on a staged prop.
          </p>
        )}
      </div>
    </section>
  );
}

export default SceneParsePanel;
