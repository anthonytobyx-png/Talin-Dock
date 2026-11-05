import { useCallback, useEffect, useRef, useState } from "react";
import type { ComputerSnapshot } from "../computers/model";
import { cloudRequest } from "../data/cloud";
import { commandId } from "../integrations/commandId";
import { Panel, Go } from "./primitives";
interface Computer {
  id: string;
  name: string;
  platform: string;
  lastSeen: number;
  online: boolean;
  snapshot: ComputerSnapshot | null;
}
function post<T>(data: unknown) {
  return cloudRequest<T>("computers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
function Volume({
  label,
  value,
  disabled,
  apply,
}: {
  label: string;
  value: number;
  disabled: boolean;
  apply: (value: number) => Promise<void>;
}) {
  const [level, setLevel] = useState(Math.round(value)),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setLevel(Math.round(value));
  }, [value, dirty]);
  return (
    <div>
      <label className="field">
        {label} · reported {Math.round(value)}%
        <input
          aria-label={label}
          type="range"
          min="0"
          max="100"
          value={level}
          disabled={disabled}
          onChange={(event) => {
            setDirty(true);
            setLevel(Number(event.target.value));
          }}
        />
      </label>
      <button
        disabled={disabled || !dirty}
        onClick={() => void apply(level).finally(() => setDirty(false))}
      >
        Apply {label.toLowerCase()} · {level}%
      </button>
    </div>
  );
}
export function ComputerPanel() {
  const [computers, setComputers] = useState<Computer[]>([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [latency, setLatency] = useState<number>();
  const alive = useRef(true),
    refreshAgain = useRef<() => Promise<void>>(async () => {}),
    generation = useRef(0),
    watch = useRef(0),
    reading = useRef(false);
  const refresh = useCallback(async () => {
    if (reading.current) return;
    if (!navigator.onLine) {
      setError(
        "Offline. Computer reports are stale and controls are unavailable.",
      );
      setLoading(false);
      return;
    }
    reading.current = true;
    const stamp = generation.current,
      start = Date.now();
    try {
      if (selected && Date.now() - watch.current > 20000) {
        await post({ operation: "watch", computerId: selected });
        watch.current = Date.now();
      }
      const result = await cloudRequest<{ computers: Computer[] }>("computers");
      if (!alive.current || stamp !== generation.current) return;
      setComputers(result.computers);
      setLatency(Date.now() - start);
      setError("");
      if (!selected && result.computers.length)
        setSelected(result.computers[0].id);
    } catch (e) {
      if (alive.current && stamp === generation.current)
        setError(
          e instanceof Error ? e.message : "Computer connection unavailable.",
        );
    } finally {
      reading.current = false;
      if (alive.current) setLoading(false);
      if (alive.current && stamp !== generation.current)
        void refreshAgain.current();
    }
  }, [selected]);
  useEffect(() => {
    refreshAgain.current = refresh;
    const revision = generation;
    alive.current = true;
    watch.current = 0;
    void refresh();
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    const offline = () => {
      generation.current++;
      setError(
        "Offline. Computer reports are stale and controls are unavailable.",
      );
    };
    const session = () => {
      generation.current++;
      setComputers([]);
      void refresh();
    };
    const timer = setInterval(visible, 5000);
    window.addEventListener("online", visible);
    window.addEventListener("offline", offline);
    window.addEventListener("talin-session-changed", session);
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive.current = false;
      revision.current++;
      clearInterval(timer);
      window.removeEventListener("online", visible);
      window.removeEventListener("offline", offline);
      window.removeEventListener("talin-session-changed", session);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  const pc = computers.find((value) => value.id === selected),
    snapshot = pc?.snapshot;
  const fresh =
    !!pc?.online &&
    !!snapshot &&
    !error &&
    navigator.onLine &&
    Date.now() - pc.lastSeen < 30000;
  const can = (action: string) =>
    fresh && !busy && !!snapshot?.capabilities.includes(action);
  async function command(
    action: string,
    value?: number | boolean,
    sessionId?: string,
  ) {
    if (!pc || !can(action)) return;
    setBusy(true);
    setMessage(
      "Request queued; waiting for the computer. It will not be retried automatically.",
    );
    try {
      const id = commandId();
      await post({
        operation: "command",
        computerId: pc.id,
        id,
        command: {
          action,
          ...(value === undefined ? {} : { value }),
          ...(sessionId ? { sessionId } : {}),
        },
      });
      let status = "pending";
      for (let i = 0; i < 20 && alive.current; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const result = await post<{ status: string }>({
          operation: "result",
          computerId: pc.id,
          id,
        });
        status = result.status;
        if (!["pending", "claimed"].includes(status)) break;
      }
      if (alive.current) {
        setMessage(
          status === "acknowledged"
            ? "Companion acknowledged the request. Check the latest reported value or the PC for the result."
            : `Execution ${["failed", "expired", "unknown"].includes(status) ? status : "unconfirmed"}. Refresh before deciding whether to try again.`,
        );
        await refresh();
      }
    } catch (e) {
      if (alive.current)
        setMessage(
          e instanceof Error
            ? e.message
            : "Request outcome unknown. Do not retry automatically.",
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">YOUR DESK, CONNECTED</span>
        <h1>Computer</h1>
        <p>
          Optional Windows companions. Home keeps working when every computer is
          off.
        </p>
      </div>
      {error && <p role="alert">{error}</p>}
      {!computers.length ? (
        <Panel
          title={
            loading ? "Checking household computers" : "No paired computer"
          }
        >
          <p>
            The free Windows companion shares measured CPU, memory, supported
            NVIDIA metrics and Windows audio controls through your existing
            household sign-in. No extra iPad certificate is needed for this
            route.
          </p>
          <Go to="Settings">Household connections</Go>
          <p>
            macOS and USB transport are not implemented. This connection needs
            internet; it is not a LAN or USB link.
          </p>
        </Panel>
      ) : (
        <>
          <label className="field">
            Computer
            <select
              value={selected}
              onChange={(event) => {
                generation.current++;
                setSelected(event.target.value);
                setMessage("");
              }}
            >
              {computers.map((value) => (
                <option key={value.id} value={value.id}>
                  {value.name} · {value.platform}
                </option>
              ))}
            </select>
          </label>
          <Panel title={pc?.name || "Computer"}>
            <span className="badge">
              {fresh ? "Connected through cloud relay" : "Disconnected / stale"}
            </span>
            <p>
              Last report:{" "}
              {pc?.lastSeen
                ? new Date(pc.lastSeen).toLocaleString()
                : "Not received"}
              . Cloud request:{" "}
              {latency === undefined ? "Unmeasured" : `${latency} ms`}; active
              sampling is about five seconds.
            </p>
            <button onClick={() => void refresh()}>
              Refresh computer status
            </button>
          </Panel>
          {snapshot && (
            <div className="two-columns">
              <div>
                <Panel title="Measured performance">
                  <p>
                    {!fresh && "Stale report. "}CPU:{" "}
                    {snapshot.cpuPercent === null
                      ? "Sampling unavailable"
                      : `${snapshot.cpuPercent}%`}
                  </p>
                  <p>
                    Memory: {(snapshot.memoryUsedMb / 1024).toFixed(1)} /{" "}
                    {(snapshot.memoryTotalMb / 1024).toFixed(1)} GiB
                  </p>
                  {snapshot.gpu ? (
                    <>
                      <p>{snapshot.gpu.name}</p>
                      <p>
                        GPU: {snapshot.gpu.loadPercent}% ·{" "}
                        {snapshot.gpu.temperatureC}°C
                      </p>
                      <p>
                        GPU memory:{" "}
                        {(snapshot.gpu.memoryUsedMb / 1024).toFixed(1)} /{" "}
                        {(snapshot.gpu.memoryTotalMb / 1024).toFixed(1)} GiB
                      </p>
                    </>
                  ) : (
                    <p>GPU measurements unavailable.</p>
                  )}
                  <p>
                    CPU temperature is unavailable; no temperature is estimated
                    from load.
                  </p>
                </Panel>
                <Panel title="Media & desktop">
                  <div className="button-row">
                    {[
                      ["mediaPrevious", "Previous"],
                      ["mediaPlayPause", "Play / pause"],
                      ["mediaNext", "Next"],
                      ["showDesktop", "Show desktop"],
                      ["taskManager", "Task Manager"],
                    ].map(([action, label]) => (
                      <button
                        key={action}
                        disabled={!can(action)}
                        onClick={() => void command(action)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p>
                    Media keys go to Windows. No playback title or playing state
                    is reported. Lock, sleep, screenshots and output switching
                    remain unavailable.
                  </p>
                </Panel>
              </div>
              <div>
                <Panel title="Windows sound mixer">
                  {snapshot.audio ? (
                    <>
                      <p>Output: {snapshot.audio.output}</p>
                      <Volume
                        label="Master volume"
                        value={snapshot.audio.volume}
                        disabled={!can("masterVolume")}
                        apply={(value) => command("masterVolume", value)}
                      />
                      <button
                        disabled={!can("masterMute")}
                        onClick={() =>
                          void command("masterMute", !snapshot.audio!.muted)
                        }
                      >
                        {snapshot.audio.muted
                          ? "Unmute speakers"
                          : "Mute speakers"}
                      </button>
                      {snapshot.audio.microphoneMuted !== null && (
                        <button
                          disabled={!can("microphoneMute")}
                          onClick={() =>
                            void command(
                              "microphoneMute",
                              !snapshot.audio!.microphoneMuted,
                            )
                          }
                        >
                          {snapshot.audio.microphoneMuted
                            ? "Unmute communications microphone"
                            : "Mute communications microphone"}
                        </button>
                      )}
                      <p>
                        Only the default Windows communications microphone is
                        affected. No microphone audio is recorded or sent to
                        Talin.
                      </p>
                      <h3>Application audio on this output</h3>
                      {snapshot.audio.sessions.length ? (
                        snapshot.audio.sessions.map((session) => (
                          <div key={session.id}>
                            <Volume
                              label={`${session.name} volume`}
                              value={session.volume}
                              disabled={!can("sessionVolume")}
                              apply={(value) =>
                                command("sessionVolume", value, session.id)
                              }
                            />
                            <button
                              disabled={!can("sessionMute")}
                              onClick={() =>
                                void command(
                                  "sessionMute",
                                  !session.muted,
                                  session.id,
                                )
                              }
                            >
                              {session.muted ? "Unmute" : "Mute"} {session.name}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>No audio sessions were reported.</p>
                      )}
                    </>
                  ) : (
                    <p>Windows audio is unavailable.</p>
                  )}
                </Panel>
              </div>
            </div>
          )}
        </>
      )}
      <p role="status">{message}</p>
    </>
  );
}
