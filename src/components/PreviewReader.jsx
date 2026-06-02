import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import IsometricRoom from "./IsometricRoom";
import PlacedAsset3D from "./PlacedAsset3D";
import Player from "./Player";
import InteractionOverlay from "./InteractionOverlay";

import { createEmptySpace, getSpacePassageFields } from "../models/document";
import { createAssetHitbox } from "../utils/hitbox";
import {
  createActionHistoryEntry,
  buildSpaceExitNarrative,
  findNearestInteractableAsset,
  getPlayableInteractions,
  getSpaceWinCondition,
  isWinConditionMet,
} from "../utils/interactions";

function PreviewReader({
  project,
  embedded = false,
  focusPassageId = null,
  onExploringSpaceChange,
  onExit,
}) {
  const [passageIndex, setPassageIndex] = useState(0);
  const [phase, setPhase] = useState("reading");
  const [actionHistory, setActionHistory] = useState([]);
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const [exitNarrative, setExitNarrative] = useState("");
  const [roomFocused, setRoomFocused] = useState(false);
  const [flashLine, setFlashLine] = useState(null);
  const roomWrapRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const focusPassageIndex = useMemo(() => {
    if (!focusPassageId) return -1;
    return project.passages.findIndex((passage) => passage.id === focusPassageId);
  }, [focusPassageId, project.passages]);

  useEffect(() => {
    if (focusPassageIndex < 0) return;
    setPassageIndex(focusPassageIndex);
    setPhase("reading");
    setActionHistory([]);
    setExitNarrative("");
  }, [focusPassageIndex]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!roomWrapRef.current?.contains(event.target)) {
        setRoomFocused(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const currentPassage = project.passages[passageIndex];

  useEffect(() => {
    if (phase === "exploring" && currentPassage?.type === "space") {
      onExploringSpaceChange?.(currentPassage.id);
      return;
    }
    onExploringSpaceChange?.(null);
  }, [phase, currentPassage, onExploringSpaceChange]);

  const space = useMemo(() => {
    if (!currentPassage || currentPassage.type !== "space") return null;
    return (
      project.spaces[currentPassage.id] ??
      createEmptySpace(currentPassage.id, {
        excerpt: getSpacePassageFields(currentPassage).sceneText,
      })
    );
  }, [currentPassage, project.spaces]);

  const { leadIn, sceneText } = getSpacePassageFields(currentPassage ?? {});
  const placedAssets = space?.placedAssets ?? [];
  const winCondition = getSpaceWinCondition(placedAssets);
  const winMet = isWinConditionMet(actionHistory, placedAssets);
  const canLeaveSpace = !winCondition || winMet;

  const nearbyInteractableAsset = useMemo(() => {
    return findNearestInteractableAsset(
      playerPosition,
      placedAssets,
      createAssetHitbox
    );
  }, [playerPosition, placedAssets]);

  const nearbyInteractions = useMemo(() => {
    if (!nearbyInteractableAsset) return [];
    return getPlayableInteractions(nearbyInteractableAsset);
  }, [nearbyInteractableAsset]);

  const collisionObjects = useMemo(() => {
    return placedAssets
      .filter((asset) => asset.isSolid)
      .map((asset) => createAssetHitbox(asset));
  }, [placedAssets]);

  function completeSpace(history) {
    const merged = buildSpaceExitNarrative(leadIn, history);
    setExitNarrative(merged);
    setPhase("merged");
  }

  function flashInteraction(line) {
    setFlashLine({ id: crypto.randomUUID(), text: line });
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashLine(null), 3200);
  }

  function performInteraction(action) {
    if (!nearbyInteractableAsset) return;
    const entry = createActionHistoryEntry(nearbyInteractableAsset, action);
    const nextHistory = [...actionHistory, entry];
    setActionHistory(nextHistory);
    flashInteraction(entry.narrativeLine);

    if (isWinConditionMet(nextHistory, placedAssets)) {
      completeSpace(nextHistory);
    }
  }

  function focusPreviewRoom() {
    setRoomFocused(true);
    roomWrapRef.current?.focus({ preventScroll: true });
  }

  function enterSpace() {
    setActionHistory([]);
    setFlashLine(null);
    setPlayerPosition([0, 0, 0]);
    setPhase("exploring");
    requestAnimationFrame(focusPreviewRoom);
  }

  function leaveSpace() {
    if (!canLeaveSpace) return;
    completeSpace(actionHistory);
  }

  function continueReading() {
    setActionHistory([]);
    setExitNarrative("");
    setPhase("reading");
    if (passageIndex < project.passages.length - 1) {
      setPassageIndex((index) => index + 1);
    }
  }

  function resetPreview() {
    setPassageIndex(focusPassageIndex >= 0 ? focusPassageIndex : 0);
    setPhase("reading");
    setActionHistory([]);
    setExitNarrative("");
    setPlayerPosition([0, 0, 0]);
  }

  if (!currentPassage) {
    return (
      <div className={`preview-reader ${embedded ? "preview-reader-embedded" : ""}`}>
        <p className="empty">No passages in this story.</p>
        {!embedded && onExit && (
          <button type="button" onClick={onExit}>
            Exit preview
          </button>
        )}
      </div>
    );
  }

  const isLastPassage = passageIndex >= project.passages.length - 1;

  return (
    <div className={`preview-reader ${embedded ? "preview-reader-embedded" : ""}`}>
      {!embedded && (
        <header className="preview-header">
          <h2>Reader preview · {project.title}</h2>
          {onExit && (
            <button type="button" className="secondary-button" onClick={onExit}>
              Exit preview
            </button>
          )}
        </header>
      )}

      {embedded && (
        <div className="preview-embedded-toolbar">
          <button
            type="button"
            className="secondary-button preview-reset-button"
            onClick={resetPreview}
          >
            Reset
          </button>
          <span className="preview-embedded-phase">
            {phase === "exploring" ? "In scene" : phase === "merged" ? "Merged" : "Reading"}
          </span>
        </div>
      )}

      {phase === "reading" && currentPassage.type === "fixed" && (
        <article className="preview-reading preview-reading-compact">
          <p className="preview-prose">{currentPassage.text}</p>
          <button type="button" onClick={continueReading}>
            {isLastPassage ? "End" : "Continue"}
          </button>
        </article>
      )}

      {(phase === "reading" || phase === "exploring") &&
        currentPassage.type === "space" && (
          <div className={`preview-space-stage preview-space-stage--${phase}`}>
            {phase === "reading" && (
              <article className="preview-reading preview-space-invite preview-reading-compact">
                {sceneText && (
                  <p className="preview-scene-epigraph">{sceneText}</p>
                )}
                <button type="button" onClick={enterSpace}>
                  Enter scene
                </button>
              </article>
            )}

            <div
              className={`preview-exploring preview-exploring-compact ${
                phase === "reading" ? "preview-exploring-preload" : ""
              }`}
            >
              <div
                ref={roomWrapRef}
                className="preview-room-wrap"
                tabIndex={phase === "exploring" ? 0 : -1}
                role="application"
                aria-label="Scene preview — use arrow keys or WASD to walk"
                aria-hidden={phase !== "exploring"}
                onPointerDown={phase === "exploring" ? focusPreviewRoom : undefined}
              >
                {flashLine && phase === "exploring" && (
                  <div className="preview-interaction-flash" key={flashLine.id}>
                    {flashLine.text}
                  </div>
                )}
                <Canvas
                  orthographic
                  frameloop="always"
                  camera={{
                    position: [6, 6, 6],
                    zoom: 42,
                    near: 0.1,
                    far: 1000,
                  }}
                  onCreated={({ gl }) => {
                    gl.setClearColor(0xf5f0e8, 1);
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
                        isSelected={false}
                        onSelect={() => {}}
                        onUpdate={() => {}}
                      />
                    ))}
                    <Player
                      collisionObjects={collisionObjects}
                      onPositionChange={setPlayerPosition}
                      inputEnabled={phase === "exploring" && roomFocused}
                    />
                  </group>
                </Canvas>

                {phase === "exploring" && (
                  <div className="preview-interact-bar">
                    {nearbyInteractableAsset && nearbyInteractions.length > 0 ? (
                      <InteractionOverlay
                        asset={nearbyInteractableAsset}
                        actions={nearbyInteractions}
                        onPerformAction={performInteraction}
                      />
                    ) : (
                      <p className="empty preview-walk-hint">
                        {placedAssets.length === 0
                          ? "Place objects in the Space panel first."
                          : "Walk near an object (arrow keys or WASD)."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {phase === "exploring" && (
                <>
                  <p className="control-hint preview-move-hint">
                    Click the scene, then use arrow keys or WASD to move.
                  </p>

                  {winCondition && !winMet && (
                    <p className="control-hint preview-win-progress">
                      Win: {winCondition.actionLabel} · {winCondition.assetName}
                    </p>
                  )}

                  {canLeaveSpace && (
                    <button
                      type="button"
                      className="leave-space-button secondary-button"
                      onClick={leaveSpace}
                    >
                      Leave
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      {phase === "merged" && currentPassage.type === "space" && (
        <article className="preview-reading preview-merged preview-reading-compact">
          <p className="preview-prose">{exitNarrative}</p>
          <button type="button" onClick={continueReading}>
            {isLastPassage ? "Finish" : "Continue"}
          </button>
        </article>
      )}
    </div>
  );
}

export default PreviewReader;
