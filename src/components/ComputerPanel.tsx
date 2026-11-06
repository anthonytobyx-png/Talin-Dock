import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComputerSnapshot } from "../computers/model";
import { cloudRequest } from "../data/cloud";
import { commandId } from "../integrations/commandId";
import { Panel } from "./primitives";
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
  const inputId = useId();
  useEffect(() => {
    if (!dirty) setLevel(Math.round(value));
  }, [value, dirty]);
  return (
    <div className="mixer-volume">
      <label
        htmlFor={inputId}
        title={`${label} · reported ${Math.round(value)}%`}
      >
        <span>{label}</span>
        <small>
          {level}%{dirty ? " · unsaved" : ""}
        </small>
      </label>
      <input
        id={inputId}
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
      <button
        aria-label={`Apply ${label.toLowerCase()} · ${level}%`}
        disabled={disabled || !dirty}
        onClick={() => void apply(level).finally(() => setDirty(false))}
      >
        Apply
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
    [audioPage, setAudioPage] = useState(0),
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
  const audioPages = Math.max(
    1,
    Math.ceil((snapshot?.audio?.sessions.length || 0) / 4),
  );
  const currentAudioPage = Math.min(audioPage, audioPages - 1);
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
    const stamp = generation.current,
      started = Date.now();
    const current = () =>
      alive.current && stamp === generation.current && navigator.onLine;
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
      const deadline = started + 20000;
      while (current() && Date.now() < deadline) {
        const result = await post<{ status: string }>({
          operation: "result",
          computerId: pc.id,
          id,
        });
        status = result.status;
        if (!["pending", "claimed"].includes(status)) break;
        await new Promise((resolve) =>
          setTimeout(resolve, Date.now() - started < 4000 ? 500 : 1000),
        );
      }
      if (current()) {
        setMessage(
          status === "acknowledged"
            ? `Companion acknowledged the request in ${Date.now() - started} ms through the cloud. Check the latest reported value or the PC for the result.`
            : `Execution ${["failed", "expired", "unknown"].includes(status) ? status : "unconfirmed"}. Refresh before deciding whether to try again.`,
        );
        await refresh();
      }
    } catch (e) {
      if (current())
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
    <section className="computer-console" aria-label="Computer controls">
      <header className="computer-toolbar">
        <h1>Computer</h1>
        {computers.length > 0 && (
          <label className="computer-picker">
            <span className="sr-only">Computer</span>
            <select
              aria-label="Computer"
              value={selected}
              onChange={(event) => {
                generation.current++;
                setSelected(event.target.value);
                setMessage("");
                setAudioPage(0);
              }}
            >
              {computers.map((value) => (
                <option key={value.id} value={value.id}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <span
          className={`computer-presence ${fresh ? "is-connected" : ""}`}
          title={
            pc?.lastSeen
              ? `Last report: ${new Date(pc.lastSeen).toLocaleString()}. Cloud request: ${latency === undefined ? "unmeasured" : `${latency} ms`}.`
              : "No report received"
          }
        >
          {fresh ? "Connected" : "Offline / stale"}
        </span>
        <button
          onClick={() => void refresh()}
          aria-label="Refresh computer status"
        >
          Refresh
        </button>
      </header>
      {error && (
        <p className="computer-error" role="alert">
          {error}
        </p>
      )}
      {!computers.length ? (
        <Panel
          title={
            loading ? "Checking household computers" : "No paired computer"
          }
        >
          <p>Your paired computers appear here when available.</p>
        </Panel>
      ) : snapshot ? (
        <div className="computer-workspace" key={selected}>
          <section className="computer-mixer" aria-label="Windows sound mixer">
            <header className="computer-section-heading">
              <h2>Sound mixer</h2>
              <span title={snapshot.audio?.output}>
                {snapshot.audio?.output || "Output unavailable"}
              </span>
            </header>
            {snapshot.audio ? (
              <>
                <div className="mixer-channel mixer-master">
                  <Volume
                    label="Master volume"
                    value={snapshot.audio.volume}
                    disabled={!can("masterVolume")}
                    apply={(value) => command("masterVolume", value)}
                  />
                  <button
                    className="mixer-mute"
                    aria-label={
                      snapshot.audio.muted ? "Unmute speakers" : "Mute speakers"
                    }
                    aria-pressed={snapshot.audio.muted}
                    disabled={!can("masterMute")}
                    onClick={() =>
                      void command("masterMute", !snapshot.audio!.muted)
                    }
                  >
                    {snapshot.audio.muted ? "Unmute" : "Mute"}
                  </button>
                </div>
                <div className="mixer-app-heading">
                  <h3>Applications</h3>
                  <small>{snapshot.audio.sessions.length} on this output</small>
                </div>
                <div className="mixer-apps">
                  {snapshot.audio.sessions.length ? (
                    snapshot.audio.sessions
                      .slice(currentAudioPage * 4, currentAudioPage * 4 + 4)
                      .map((session) => (
                        <div className="mixer-channel" key={session.id}>
                          <Volume
                            label={`${session.name} volume`}
                            value={session.volume}
                            disabled={!can("sessionVolume")}
                            apply={(value) =>
                              command("sessionVolume", value, session.id)
                            }
                          />
                          <button
                            className="mixer-mute"
                            aria-label={`${session.muted ? "Unmute" : "Mute"} ${session.name}`}
                            aria-pressed={session.muted}
                            disabled={!can("sessionMute")}
                            onClick={() =>
                              void command(
                                "sessionMute",
                                !session.muted,
                                session.id,
                              )
                            }
                          >
                            {session.muted ? "Unmute" : "Mute"}
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="mixer-empty">
                      No audio sessions were reported.
                    </p>
                  )}
                </div>
                <nav
                  className="mixer-pagination"
                  aria-label="Audio application pages"
                >
                  <button
                    aria-label="Previous audio applications"
                    disabled={currentAudioPage === 0}
                    onClick={() => setAudioPage(currentAudioPage - 1)}
                  >
                    Previous
                  </button>
                  <small>
                    Page {currentAudioPage + 1} of {audioPages}
                  </small>
                  <button
                    aria-label="Next audio applications"
                    disabled={currentAudioPage + 1 >= audioPages}
                    onClick={() => setAudioPage(currentAudioPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              </>
            ) : (
              <p>Windows audio is unavailable.</p>
            )}
          </section>
          <aside
            className="computer-utilities"
            aria-label="Performance and shortcuts"
          >
            <section
              className="computer-performance"
              aria-label="Measured performance"
            >
              <h2>Performance{!fresh ? " · stale" : ""}</h2>
              <div className="computer-metrics">
                <div>
                  <small>CPU</small>
                  <strong>
                    {snapshot.cpuPercent === null
                      ? "Unavailable"
                      : `${snapshot.cpuPercent}%`}
                  </strong>
                </div>
                <div>
                  <small>Memory</small>
                  <strong>
                    {(snapshot.memoryUsedMb / 1024).toFixed(1)}{" "}
                    <small>
                      / {(snapshot.memoryTotalMb / 1024).toFixed(0)} GiB
                    </small>
                  </strong>
                </div>
                <div title={snapshot.gpu?.name}>
                  <small>GPU</small>
                  <strong>
                    {snapshot.gpu
                      ? `${snapshot.gpu.loadPercent}%`
                      : "Unavailable"}
                  </strong>
                  <small>
                    {snapshot.gpu
                      ? `${snapshot.gpu.temperatureC}°C`
                      : "No report"}
                  </small>
                </div>
                <div>
                  <small>GPU memory</small>
                  <strong>
                    {snapshot.gpu
                      ? `${(snapshot.gpu.memoryUsedMb / 1024).toFixed(1)} GiB`
                      : "Unavailable"}
                  </strong>
                  {snapshot.gpu && (
                    <small>
                      of {(snapshot.gpu.memoryTotalMb / 1024).toFixed(0)} GiB
                    </small>
                  )}
                </div>
              </div>
            </section>
            <section
              className="computer-shortcuts"
              aria-label="Media and desktop"
            >
              <h2>Media & desktop</h2>
              <div className="computer-media-keys">
                {[
                  ["mediaPrevious", "Previous"],
                  ["mediaPlayPause", "Play / pause"],
                  ["mediaNext", "Next"],
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
              <div className="computer-desktop-keys">
                {[
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
              <small>
                Media keys are sent to Windows; playback state is not reported.
              </small>
            </section>
            {snapshot.audio?.microphoneMuted !== null &&
              snapshot.audio?.microphoneMuted !== undefined && (
                <section
                  className="computer-microphone"
                  aria-label="Communications microphone"
                >
                  <div>
                    <h2>Microphone</h2>
                    <small>
                      Default communications input · no audio collected
                    </small>
                  </div>
                  <button
                    aria-pressed={snapshot.audio.microphoneMuted}
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
                </section>
              )}
          </aside>
        </div>
      ) : (
        <Panel title="Waiting for a report">
          <p>The selected account has not sent a computer report yet.</p>
        </Panel>
      )}
      <p className="computer-command-status" role="status">
        {message}
      </p>
    </section>
  );
}
