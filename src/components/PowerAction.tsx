import { Power, PowerOff } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

// Presentation only: each button keeps its caller's explicit command and guards.
export function PowerAction({
  on,
  reported,
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  on: boolean;
  reported?: boolean | null;
  label?: string;
}) {
  const name = label || `Turn ${on ? "on" : "off"}`;
  const Icon = on ? Power : PowerOff;
  return (
    <button
      {...props}
      className={`power-action power-action-${on ? "on" : "off"} ${className}`}
      aria-label={name}
      title={name}
      data-reported={
        typeof reported === "boolean" && reported === on ? "true" : undefined
      }
    >
      <Icon size={23} aria-hidden="true" />
      <span>{on ? "On" : "Off"}</span>
    </button>
  );
}
