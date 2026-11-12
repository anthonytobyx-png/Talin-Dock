import { useEffect, useState } from "react";

// A decorative SVG visitor stays inside its own header lane, away from controls.
// No animation loop, network calls, interaction handlers or device access.
export function PixelCompanion() {
  const [paused, setPaused] = useState(document.hidden);
  useEffect(() => {
    const changed = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  return (
    <div
      className={`companion-habitat ${paused ? "companion-paused" : ""}`}
      aria-hidden="true"
      data-testid="pixel-visitor"
    >
      <span className="companion-shelter companion-shelter-left" />
      <span className="companion-shelter companion-shelter-right" />
      <div className="companion-wander">
        <div className="pixel-critter">
          <svg
            viewBox="0 0 24 24"
            width="34"
            height="34"
            shapeRendering="crispEdges"
            focusable="false"
          >
            <g className="critter-tail">
              <path d="M6 15H3v-4H1v6h5z" fill="var(--critter-coat)" />
            </g>
            <path
              d="M6 7V4h3v3h3V2h2v5h3V4h3v5h2v9h-3v2H7v-2H5V9h1z"
              fill="var(--critter-coat)"
            />
            <path
              d="M7 8V6h1v2zm11 0V6h1v2zM11 1h4v2h-4zM9 15h9v3H9z"
              fill="var(--critter-light)"
            />
            <g className="critter-eyes" fill="#122332">
              <path d="M8 10h2v3H8zm5 0h2v3h-2zm5 0h2v3h-2z" />
            </g>
            <path d="M12 15h3v1h-3z" fill="#122332" />
            <path
              className="critter-foot-one"
              d="M7 19h4v2H7z"
              fill="var(--critter-coat)"
            />
            <path
              className="critter-foot-two"
              d="M17 19h4v2h-4z"
              fill="var(--critter-coat)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
