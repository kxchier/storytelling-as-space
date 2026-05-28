import { BLANK_TOKEN } from "../models/document";

function PassageTextDisplay({ text, className = "" }) {
  if (!text) return null;

  const parts = text.split(BLANK_TOKEN);

  return (
    <p className={`passage-display ${className}`.trim()}>
      {parts.map((part, index) => (
        <span key={`${index}-${part.slice(0, 8)}`}>
          {part}
          {index < parts.length - 1 && (
            <span className="blank-chip" aria-label={`Blank ${index + 1}`}>
              Blank {index + 1}
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

export default PassageTextDisplay;
