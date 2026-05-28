import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "storytelling-workspace-left-percent";
const DEFAULT_PERCENT = 42;
const MIN_LEFT_PERCENT = 18;
const MAX_LEFT_PERCENT = 78;

function readStoredPercent() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(value) && value >= MIN_LEFT_PERCENT && value <= MAX_LEFT_PERCENT) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PERCENT;
}

function WorkspaceSplit({ left, right }) {
  const containerRef = useRef(null);
  const [leftPercent, setLeftPercent] = useState(readStoredPercent);
  const [isDragging, setIsDragging] = useState(false);

  const persistPercent = useCallback((percent) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(percent)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;

    function onMouseMove(event) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const percent = (offsetX / rect.width) * 100;
      const clamped = Math.min(
        MAX_LEFT_PERCENT,
        Math.max(MIN_LEFT_PERCENT, percent)
      );
      setLeftPercent(clamped);
    }

    function onMouseUp() {
      setIsDragging(false);
      setLeftPercent((current) => {
        persistPercent(current);
        return current;
      });
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, persistPercent]);

  function startDrag(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function resetSplit() {
    setLeftPercent(DEFAULT_PERCENT);
    persistPercent(DEFAULT_PERCENT);
  }

  return (
    <div
      ref={containerRef}
      className={`workspace-split ${isDragging ? "workspace-split-dragging" : ""}`}
    >
      <div
        className="workspace-split-left"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>

      <div
        className="workspace-split-handle"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPercent)}
        aria-valuemin={MIN_LEFT_PERCENT}
        aria-valuemax={MAX_LEFT_PERCENT}
        aria-label="Resize panels. Double-click to reset."
        onMouseDown={startDrag}
        onDoubleClick={resetSplit}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setLeftPercent((p) => {
              const next = Math.max(MIN_LEFT_PERCENT, p - 2);
              persistPercent(next);
              return next;
            });
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setLeftPercent((p) => {
              const next = Math.min(MAX_LEFT_PERCENT, p + 2);
              persistPercent(next);
              return next;
            });
          }
        }}
      />

      <div className="workspace-split-right">{right}</div>
    </div>
  );
}

export default WorkspaceSplit;
