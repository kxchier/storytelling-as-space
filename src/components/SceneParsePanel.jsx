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
        What the reader steps into — write setup prose in the fixed passage above.
        Replaced on exit by exploration lines.
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
        {loadingParse ? "Parsing..." : "Parse scene"}
      </button>

      {parseError && <p className="parse-error">{parseError}</p>}

      {assetCandidates.length > 0 && (
        <>
          <p className="control-hint scene-parse-objects-label">Objects found</p>
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
            Win: <strong>{winCondition.actionLabel}</strong> on{" "}
            <strong>{winCondition.assetName}</strong>
          </p>
        ) : (
          <p className="empty scene-win-unset">
            Mark one interaction as &ldquo;Completes space&rdquo; on a placed object.
          </p>
        )}
      </div>
    </section>
  );
}

export default SceneParsePanel;
