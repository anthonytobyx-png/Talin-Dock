import { useState } from "react";
import { canControl, type Device } from "../devices/model";
import { sendCommand } from "../integrations/contracts";
import {
  addPowerTimer,
  readPowerTimers,
  cancelPowerTimer,
  canUsePowerTimers,
  type TimerAdapter,
  type PowerTimer,
} from "../integrations/powerTimers";
export function DeviceControls({
  device,
  adapter,
}: {
  device: Device;
  adapter?: TimerAdapter;
}) {
  const [minutes, setMinutes] = useState("30");
  const [power, setPower] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [timers, setTimers] = useState<PowerTimer[]>([]);
  const powerReady =
    !!adapter && device.adapterId === adapter.id && canControl(device, "power");
  const timerReady = !!adapter && canUsePowerTimers(device, adapter);
  const seconds = Number(minutes) * 60;
  const durationReady =
    timerReady &&
    minutes.trim() !== "" &&
    Number.isSafeInteger(seconds) &&
    seconds >= device.powerTimer!.minSeconds &&
    seconds <= device.powerTimer!.maxSeconds;
  async function run(operation: () => Promise<void>) {
    setBusy(true);
    try {
      await operation();
    } catch {
      setMessage(
        "No action was confirmed. Refresh device status before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    const result = await readPowerTimers(adapter!, device);
    if (result.ok) {
      setTimers(result.value);
      setMessage(
        "Timer status refreshed. Listed times are schedules, not proof of execution.",
      );
    } else setMessage(result.error.message);
  }
  return (
    <section aria-label={`${device.name} power and timers`}>
      <h3>Power &amp; timers</h3>
      <div className="button-row">
        {[true, false].map((on) => (
          <button
            key={String(on)}
            disabled={!powerReady || busy}
            onClick={() =>
              run(async () => {
                const result = await sendCommand(adapter!, device, {
                  capability: "power",
                  value: on,
                });
                setMessage(
                  result.ok
                    ? `Turn ${on ? "on" : "off"} request acknowledged. Refresh device status to confirm the result.`
                    : result.error.message,
                );
              })
            }
          >
            Turn {on ? "on" : "off"}
          </button>
        ))}
      </div>
      {!powerReady && (
        <p>Connect this device and verify power control to enable on/off.</p>
      )}
      <label className="field">
        Timer action
        <select
          value={String(power)}
          disabled={!timerReady || busy}
          onChange={(e) => setPower(e.target.value === "true")}
        >
          <option value="false">Turn off</option>
          <option value="true">Turn on</option>
        </select>
      </label>
      <label className="field">
        Countdown (minutes)
        <input
          type="number"
          inputMode="decimal"
          value={minutes}
          min={device.powerTimer ? device.powerTimer.minSeconds / 60 : 1}
          max={
            device.powerTimer ? device.powerTimer.maxSeconds / 60 : undefined
          }
          step="any"
          disabled={!timerReady || busy}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </label>
      <div className="button-row">
        <button
          disabled={!durationReady || busy}
          onClick={() =>
            run(async () => {
              const result = await addPowerTimer(
                adapter!,
                device,
                power,
                seconds,
              );
              if (result.ok) {
                setTimers((current) => [
                  ...current.filter((t) => t.id !== result.value.id),
                  result.value,
                ]);
                setMessage(
                  `Timer accepted by ${result.value.executor === "device" ? "the device" : "the online service"}. Execution is not yet verified.`,
                );
              } else setMessage(result.error.message);
            })
          }
        >
          Add timer
        </button>
        <button disabled={!timerReady || busy} onClick={() => run(refresh)}>
          Refresh timers
        </button>
      </div>
      <p>
        {timerReady
          ? device.powerTimer!.executor === "device"
            ? "Timers run on the device; Talin can be closed. The device must remain powered and available."
            : "Timers run through the online service; Talin can be closed. Internet access is required for delivery."
          : "Timers need a verified device timer or an authenticated online scheduling service. Keeping this page open is not a reliable timer."}
      </p>
      {timers.map((timer) => (
        <div key={timer.id} className="layout-row">
          <span>
            Turn {timer.power ? "on" : "off"} ·{" "}
            {new Date(timer.dueAt).toLocaleString()} ·{" "}
            {timer.executor === "device" ? "Device timer" : "Online service"}
            {timer.status &&
              ` · ${timer.status === "acknowledged" ? "Command acknowledged; check the appliance" : timer.status}`}
          </span>
          <button
            disabled={
              busy ||
              !timerReady ||
              (!!timer.status && timer.status !== "pending")
            }
            onClick={() =>
              run(async () => {
                const result = await cancelPowerTimer(
                  adapter!,
                  device,
                  timer.id,
                );
                if (result.ok) {
                  setTimers((current) =>
                    current.filter((t) => t.id !== timer.id),
                  );
                  setMessage("Timer cancellation acknowledged.");
                } else setMessage(result.error.message);
              })
            }
          >
            Cancel timer
          </button>
        </div>
      ))}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
