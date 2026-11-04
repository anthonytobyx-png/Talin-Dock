import { useRef, useState } from "react";
import { useStore } from "../state/Store";
import { decode } from "../state/storage";
import type { AppState } from "../state/model";
import { Panel } from "./primitives";
export function BackupSettings() {
  const { state, dispatch } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [message, setMessage] = useState("");
  function download() {
    const blob = new Blob(
      [JSON.stringify(decode(JSON.stringify(state)), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `talin-dock-preferences-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Panel title="Backup & restore">
      <p>
        Export profiles, location and widget layouts. Backups contain personal
        display names, but no passwords, account tokens or calendar contents.
      </p>
      <div className="button-row">
        <button onClick={download}>Export preferences</button>
        <button onClick={() => file.current?.click()}>Choose backup</button>
      </div>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Import preferences backup"
        onChange={async (event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          setPending(null);
          if (!selected) return;
          if (selected.size > 32768) {
            setMessage("Backup is too large. Maximum size is 32 KB.");
            return;
          }
          try {
            const raw = await selected.text();
            const data = JSON.parse(raw);
            if (data?.version !== 1 || !data.profiles || !data.household)
              throw new Error();
            const candidate = decode(raw);
            setPending(candidate);
            setMessage(
              `Ready to restore ${candidate.profiles.anthony.name} and ${candidate.profiles.barbara.name}’s preferences. Existing preferences will be replaced. Unknown fields are discarded.`,
            );
          } catch {
            setMessage(
              "This is not a supported Talin Dock backup. Nothing was changed.",
            );
          }
        }}
      />
      <p role="status">{message}</p>
      {pending && (
        <div className="button-row">
          <button
            onClick={() => {
              dispatch({ type: "replace", state: pending });
              setPending(null);
              setMessage("Backup restored on this browser.");
            }}
          >
            Replace local preferences
          </button>
          <button
            onClick={() => {
              setPending(null);
              setMessage("Restore cancelled.");
            }}
          >
            Cancel restore
          </button>
        </div>
      )}
    </Panel>
  );
}
