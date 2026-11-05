import { useState } from "react";
import { useTuya, tuyaRequest } from "../data/TuyaContext";
import { commandId } from "../integrations/commandId";
export function TuyaConnection() {
  const connection = useTuya();
  const [code, setCode] = useState(""),
    [qr, setQr] = useState(""),
    [connectionId, setConnectionId] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [setup, setSetup] = useState(false),
    [replace, setReplace] = useState(false);
  async function begin() {
    setBusy(true);
    setMessage("Requesting Smart Life consent…");
    try {
      const result = await tuyaRequest<{
        connectionId: string;
        qrData: string;
      }>("/connect", { userCode: code.trim(), replace });
      const { default: qrcode } = await import("qrcode-generator");
      const image = qrcode(0, "M");
      image.addData(result.qrData);
      image.make();
      setQr(image.createDataURL(5, 8));
      setConnectionId(result.connectionId);
      setMessage(
        "In Smart Life, choose + → Scan, scan this QR, and review and approve the connection. Then check the connection below.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Consent request unavailable.",
      );
    } finally {
      setCode("");
      setBusy(false);
    }
  }
  async function check() {
    setBusy(true);
    try {
      const result = await tuyaRequest<{
        pending?: boolean;
        connected?: boolean;
      }>("/poll", { connectionId });
      if (result.connected) {
        setQr("");
        setConnectionId("");
        setSetup(false);
        setMessage(
          "Smart Life connected. No appliance commands were sent during setup.",
        );
        await connection.refresh();
      } else
        setMessage(
          "Smart Life consent is still pending or the QR has expired. Approve it in Smart Life, then check again.",
        );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Connection not confirmed. Refresh before retrying.",
      );
      await connection.refresh();
    } finally {
      setBusy(false);
    }
  }
  async function countdown(action: "2h" | "cancel") {
    setBusy(true);
    try {
      const result = await tuyaRequest<{ acknowledged: boolean }>("/action", {
        action,
        requestId: commandId(),
      });
      setMessage(
        result.acknowledged
          ? "Device countdown request acknowledged. Refresh and check the appliance’s timer display."
          : "Countdown outcome unknown. Check the appliance before retrying.",
      );
      await connection.refresh();
    } catch {
      setMessage(
        "Countdown outcome unknown. Refresh and check the appliance before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  const state = connection.state;
  return (
    <section aria-label="Smart Life connection">
      <h3>Smart Life connection</h3>
      <p>
        {connection.error ||
          (!connection.available
            ? "Sign in to household cloud storage in Settings. Secure Smart Life setup must also be configured."
            : connection.connected
              ? "Connected directly through Tuya’s cloud. This PC is not part of the control route."
              : "Connect your existing Smart Life account to read this appliance’s actual capabilities.")}
      </p>
      <button
        disabled={busy || connection.loading}
        onClick={() => connection.refresh()}
      >
        Refresh Smart Life state
      </button>
      {connection.available && (
        <button disabled={busy} onClick={() => setSetup(!setup)}>
          {connection.connected ? "Reconnect Smart Life" : "Connect Smart Life"}
        </button>
      )}
      {connection.available && setup && !qr && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void begin();
          }}
        >
          <p>
            Talin uses Tuya’s official device-sharing protocol through the
            public Home Assistant registration. This is an independent Talin
            connection; Tuya may label consent Home Assistant or Non-Mobile
            Devices. It can authorise device access and control. Credentials are
            encrypted in your Cloudflare account, never browser storage. No
            developer project, payment or trial is created.
          </p>
          <p>The service may change or ask you to authorise again.</p>
          <label className="field">
            Smart Life User Code
            <input
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={128}
            />
          </label>
          <p>Smart Life → Me → Settings → Account and Security → User Code.</p>
          {connection.connected && (
            <label>
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />{" "}
              Replace the existing Smart Life connection
            </label>
          )}
          <button
            disabled={
              busy || !code.trim() || (connection.connected && !replace)
            }
          >
            Generate Smart Life consent QR
          </button>
        </form>
      )}
      {qr && (
        <>
          <img
            src={qr}
            alt="Scan with Smart Life to authorise Talin device access"
            style={{ maxWidth: "100%", background: "white" }}
          />
          <button disabled={busy} onClick={check}>
            I approved in Smart Life — check connection
          </button>
        </>
      )}
      {connection.connected && state && (
        <>
          <p>
            Power reported by Smart Life:{" "}
            {state.power === null ? "Unknown" : state.power ? "On" : "Off"}.
            Retrieved {new Date(state.observedAt).toLocaleString()}.
          </p>
          {state.countdownOptions.includes("2h") && (
            <>
              <p>
                This appliance advertises a native 2-hour countdown. Its
                remaining time is{" "}
                {state.countdownLeft === null
                  ? "unavailable"
                  : `${state.countdownLeft} minutes`}
                . Confirm the timer display after setting it.
              </p>
              <div className="button-row">
                <button
                  disabled={
                    busy ||
                    !!connection.error ||
                    !state.online ||
                    state.power !== true
                  }
                  onClick={() => countdown("2h")}
                >
                  Set device 2-hour countdown
                </button>
                <button
                  disabled={busy || !!connection.error || !state.online}
                  onClick={() => countdown("cancel")}
                >
                  Cancel device countdown
                </button>
              </div>
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
