import { useCallback, useEffect, useState } from "react";
import { cloudRequest } from "../data/cloud";
export function ComputerSettings() {
  const [computers, setComputers] = useState<
      { id: string; name: string; platform: string }[]
    >([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const value = await cloudRequest<{ computers: typeof computers }>(
        "computers",
      );
      setComputers(value.computers);
    } catch {
      setComputers([]);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener("talin-session-changed", refresh);
    return () => window.removeEventListener("talin-session-changed", refresh);
  }, [refresh]);
  async function pair(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 4096) throw Error("Invalid pairing request.");
      const data = JSON.parse(await file.text());
      const result = await cloudRequest<{ paired: boolean }>("computers", {
        method: "POST",
        body: JSON.stringify({
          operation: "pair",
          id: data.id,
          name: data.name,
          platform: data.platform,
          tokenHash: data.tokenHash,
        }),
      });
      setMessage(
        result.paired
          ? "Computer paired to this household. Start its companion to receive real reports."
          : "Pairing was not confirmed.",
      );
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Pairing unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Computer connections">
      <h3>Computer connections</h3>
      <p>
        The Windows companion uses this household’s existing sign-in. Its
        credential is encrypted for the Windows user; there is no password for
        each computer widget.
      </p>
      <p>
        Import only the pairing-request.json produced on a computer you own.
        Pairing allows signed-in household users to read that computer’s
        performance/application-audio reports and send its advertised audio,
        media and desktop commands.
      </p>
      <label className="field">
        Pair a computer
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => {
            void pair(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <ul>
        {computers.map((pc) => (
          <li key={pc.id}>
            {pc.name} · {pc.platform}
            <button
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    `Revoke ${pc.name}? Queued actions will expire. An action already executing may finish.`,
                  )
                )
                  return;
                setBusy(true);
                void cloudRequest("computers", {
                  method: "POST",
                  body: JSON.stringify({
                    operation: "revoke",
                    computerId: pc.id,
                  }),
                })
                  .then(() => {
                    setMessage("Computer access revoked.");
                    return refresh();
                  })
                  .catch(() => setMessage("Revocation was not confirmed."))
                  .finally(() => setBusy(false));
              }}
            >
              Revoke computer access
            </button>
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
    </section>
  );
}
