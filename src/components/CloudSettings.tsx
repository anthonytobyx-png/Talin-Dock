import { useEffect, useState, type FormEvent } from "react";
import { Cloud, Lock } from "lucide-react";
import { cloudRequest, type CloudSnapshot } from "../data/cloud";
import { useStore } from "../state/Store";
import { decode } from "../state/storage";
import { Panel } from "./primitives";
export function CloudSettings() {
  const { state, dispatch } = useStore();
  const [session, setSession] = useState<{
    configured: boolean;
    authenticated: boolean;
  } | null>(null);
  const [snapshot, setSnapshot] = useState<CloudSnapshot | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Checking cloud availability…");
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  useEffect(() => {
    let active = true;
    cloudRequest<{ configured: boolean; authenticated: boolean }>("session")
      .then((value) => {
        if (active) {
          setSession(value);
          setMessage(
            value.configured
              ? "Cloud storage is available."
              : "Cloud sync needs deployment setup. Your settings are stored on this browser.",
          );
        }
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function task(run: () => Promise<void>) {
    setBusy(true);
    setMessage("Working…");
    try {
      await run();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cloud request failed",
      );
    } finally {
      setBusy(false);
    }
  }
  function login(event: FormEvent) {
    event.preventDefault();
    const submitted = password;
    setPassword("");
    void task(async () => {
      await cloudRequest("login", {
        method: "POST",
        body: JSON.stringify({ password: submitted }),
      });
      setSession({ configured: true, authenticated: true });
      setMessage("Signed in. Load the latest cloud copy before saving.");
    });
  }
  return (
    <Panel title="Household cloud storage">
      <div className="cloud-heading">
        <Cloud size={24} />
        <span className="badge">
          {session?.authenticated
            ? "Signed in"
            : session?.configured
              ? "Sign-in required"
              : "Local only"}
        </span>
      </div>
      <p>
        Sync non-sensitive profiles and room layouts between your devices. This
        shared household sign-in is separate from display profiles.
      </p>
      <p role="status">{message}</p>
      {session?.configured && !session.authenticated && (
        <form onSubmit={login}>
          <label className="field">
            Household passphrase
            <input
              type="password"
              autoComplete="current-password"
              minLength={12}
              maxLength={256}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            <Lock size={16} />
            Sign in
          </button>
        </form>
      )}
      {session?.authenticated && (
        <>
          <div className="button-row">
            <button
              disabled={busy}
              onClick={() =>
                void task(async () => {
                  const value =
                    await cloudRequest<CloudSnapshot>("preferences");
                  setSnapshot(value);
                  setReplace(false);
                  setMessage(
                    value.state
                      ? `Cloud revision ${value.revision}. Choose which copy to keep.`
                      : "Cloud is empty. You can save this browser’s preferences.",
                  );
                })
              }
            >
              Read cloud copy
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void task(async () => {
                  await cloudRequest("logout", { method: "POST", body: "{}" });
                  setSession({ configured: true, authenticated: false });
                  setSnapshot(null);
                  setMessage(
                    "Signed out. Local preferences remain on this browser.",
                  );
                })
              }
            >
              Sign out
            </button>
          </div>
          {snapshot && (
            <>
              <label className="setting-row">
                I understand this will replace the selected destination’s
                preferences
                <input
                  type="checkbox"
                  checked={replace}
                  onChange={(event) => setReplace(event.target.checked)}
                />
              </label>
              <div className="button-row">
                <button
                  disabled={busy || !replace || !snapshot.state}
                  onClick={() => {
                    dispatch({
                      type: "replace",
                      state: decode(JSON.stringify(snapshot.state)),
                    });
                    setMessage("Cloud copy loaded on this browser.");
                    setReplace(false);
                  }}
                >
                  Use cloud on this device
                </button>
                <button
                  disabled={busy || !replace}
                  onClick={() =>
                    void task(async () => {
                      const result = await cloudRequest<{ revision: number }>(
                        "preferences",
                        {
                          method: "PUT",
                          headers: { "If-Match": `"${snapshot.revision}"` },
                          body: JSON.stringify(decode(JSON.stringify(state))),
                        },
                      );
                      setSnapshot({
                        ...snapshot,
                        state,
                        revision: result.revision,
                      });
                      setReplace(false);
                      setMessage(`Saved cloud revision ${result.revision}.`);
                    })
                  }
                >
                  Save this device to cloud
                </button>
              </div>
            </>
          )}
        </>
      )}
      <small>
        Cloud access uses a secure, HttpOnly, seven-day cookie. No password,
        token or private calendar data is stored in browser preferences. Signing
        out does not erase local preferences on a shared device.
      </small>
    </Panel>
  );
}
