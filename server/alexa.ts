export interface Trigger {
  trigger: string;
  token: string;
}
export type AlexaActions = Record<
  string,
  Partial<Record<"on" | "off", Trigger>>
>;
const deviceIds = new Set(["samsung-tv", "tuya-dehumidifier"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only individually verified routines belong in this encrypted server secret.
// A configured routine is NOT evidence of device connectivity or current power.
export function readAlexaActions(secret?: string): AlexaActions {
  try {
    const input = JSON.parse(secret || "{}");
    const result: AlexaActions = {};
    for (const [id, actions] of Object.entries(input)) {
      if (!deviceIds.has(id) || !actions || typeof actions !== "object")
        continue;
      for (const action of ["on", "off"] as const) {
        const value = (actions as Record<string, unknown>)[action];
        if (!value || typeof value !== "object") continue;
        const item = value as Record<string, unknown>;
        if (
          item.verified === true &&
          typeof item.trigger === "string" &&
          uuid.test(item.trigger) &&
          typeof item.token === "string" &&
          uuid.test(item.token)
        ) {
          (result[id] ||= {})[action] = {
            trigger: item.trigger,
            token: item.token,
          };
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function triggerAlexa(
  credential: Trigger,
  request: typeof fetch = fetch,
): Promise<boolean> {
  const url = new URL(
    "https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php",
  );
  url.search = new URLSearchParams({
    ...credential,
    response: "json",
  }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await request(url, {
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) return false;
    const payload = await response.text();
    if (payload.length > 8192) return false;
    const result = JSON.parse(payload)?.URLRoutineTrigger;
    return (
      result?.triggerId === credential.trigger &&
      result?.triggerActivationStatus === "success"
    );
  } catch {
    // Never include upstream responses, credential URLs, or exception details in logs.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
