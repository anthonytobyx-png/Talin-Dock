import { useState } from "react";
import { Go } from "./primitives";

// Safari 15 supports getRandomValues, but not crypto.randomUUID.
function commandId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function AlexaPowerControls({ deviceId }: { deviceId: string }) {
  const [actions, setActions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Check your household connection to load verified Alexa actions.",
  );
  const [signIn, setSignIn] = useState(false);
  const [timerReady, setTimerReady] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState("30");
  const [timerAction, setTimerAction] = useState("off");
  const [timers, setTimers] = useState<
    {
      id: string;
      deviceId: string;
      action: string;
      dueAt: string;
      status: string;
    }[]
  >([]);
  async function refreshTimers(signal?: AbortSignal) {
    const response = await fetch("/api/power-timers", {
      cache: "no-store",
      signal,
    });
    if (!response.ok) {
      setTimerReady(false);
      return;
    }
    const data = await response.json();
    setTimerReady(data.ready === true);
    setTimers(
      Array.isArray(data.timers)
        ? data.timers.filter(
            (t: { deviceId: string }) => t.deviceId === deviceId,
          )
        : [],
    );
  }
  async function check() {
    setBusy(true);
    setActions([]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/device-actions", {
        cache: "no-store",
        signal: controller.signal,
      });
      setSignIn(response.status === 401);
      if (!response.ok) {
        setMessage(
          response.status === 401
            ? "Sign in to household cloud storage in Settings, then check again."
            : "Household device service unavailable.",
        );
        return;
      }
      const data = await response.json();
      const value = data.devices?.[deviceId];
      const available = Array.isArray(value)
        ? value.filter((v: unknown) => v === "on" || v === "off")
        : [];
      setActions(available);
      await refreshTimers(controller.signal);
      setMessage(
        available.length
          ? "Verified routine actions loaded. Current device state is unavailable."
          : "Alexa routines are not connected and verified for this device yet.",
      );
    } catch {
      setMessage("No connection. Alexa controls require internet access.");
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }
  async function changeTimer(cancelId?: string) {
    setBusy(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/power-timers", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Talin-Request": "1" },
        body: JSON.stringify(
          cancelId
            ? { operation: "cancel", id: cancelId }
            : {
                operation: "create",
                id: commandId(),
                deviceId,
                action: timerAction,
                seconds: Number(timerMinutes) * 60,
              },
        ),
      });
      setMessage(
        response.ok
          ? cancelId
            ? "Timer cancelled before dispatch."
            : "Timer saved in the cloud. It runs with this page closed and this PC off; check the appliance after it is due."
          : "Timer change was not confirmed. Refresh the connection before retrying.",
      );
      await refreshTimers(controller.signal);
    } catch {
      setMessage(
        "Connection interrupted. Timer outcome is unknown; refresh before retrying.",
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }
  async function send(action: "on" | "off") {
    setBusy(true);
    setMessage("Sending routine request…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/device-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Talin-Request": "1" },
        body: JSON.stringify({ deviceId, action, requestId: commandId() }),
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 503) setActions([]);
      const result = await response.json();
      setMessage(
        response.ok && result.acknowledged === true
          ? `Alexa trigger acknowledged the turn ${action} request. Device state is not reported; check the appliance.`
          : "No successful trigger acknowledgement. The device may have received the command. Check the appliance before retrying.",
      );
    } catch {
      setMessage(
        "Connection interrupted. The device may have received the command. Check the appliance before retrying.",
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }
  return (
    <section aria-label="Alexa routine power controls">
      <h3>Alexa connection</h3>
      <p>
        Uses your linked Alexa devices through the cloud. This PC can be
        switched off.
      </p>
      <button disabled={busy} onClick={check}>
        Check Alexa connection
      </button>
      <div className="button-row">
        {(["on", "off"] as const).map((action) => (
          <button
            key={action}
            disabled={busy || !actions.includes(action)}
            onClick={() => send(action)}
          >
            Alexa: turn {action}
          </button>
        ))}
      </div>
      <p role="status">{message}</p>
      <h4>Cloud countdown</h4>
      <p>
        Runs approximately once per minute. Internet and Alexa must be
        available. A missed countdown expires rather than switching a device
        much later.
      </p>
      {!timerReady && (
        <p>Cloud timer service is not ready. Timers stay disabled.</p>
      )}
      <label className="field">
        Alexa timer action
        <select
          value={timerAction}
          disabled={busy || !timerReady}
          onChange={(e) => setTimerAction(e.target.value)}
        >
          <option value="off">Turn off</option>
          <option value="on">Turn on</option>
        </select>
      </label>
      <label className="field">
        Alexa countdown (minutes)
        <input
          type="number"
          min="2"
          max="1440"
          step="1"
          value={timerMinutes}
          disabled={busy || !timerReady}
          onChange={(e) => setTimerMinutes(e.target.value)}
        />
      </label>
      <button
        disabled={
          busy ||
          !timerReady ||
          !actions.includes(timerAction) ||
          !Number.isInteger(Number(timerMinutes)) ||
          Number(timerMinutes) < 2 ||
          Number(timerMinutes) > 1440
        }
        onClick={() => changeTimer()}
      >
        Save cloud timer
      </button>
      <ul>
        {timers.map((timer) => (
          <li key={timer.id}>
            Turn {timer.action} · {new Date(timer.dueAt).toLocaleString()} ·{" "}
            {timer.status === "acknowledged"
              ? "Trigger acknowledged; device state unreported"
              : timer.status}
            <button
              disabled={busy || timer.status !== "pending"}
              onClick={() => changeTimer(timer.id)}
            >
              Cancel cloud timer
            </button>
          </li>
        ))}
      </ul>
      {signIn && <Go to="Settings">Household sign-in</Go>}
    </section>
  );
}
