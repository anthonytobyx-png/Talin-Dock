export const defaultTvEndpoint = "https://192.168.1.3:38293";
export const tvRemoteActions = [
  "up",
  "down",
  "left",
  "right",
  "ok",
  "back",
  "home",
  "volumeUp",
  "volumeDown",
  "mute",
  "unmute",
] as const;
export type TvRemoteAction = (typeof tvRemoteActions)[number];
export interface HubTimer {
  id: string;
  action: "on" | "off";
  dueAt: number;
  status: "pending" | "claimed" | "sent" | "unknown" | "cancelled" | "expired";
}
export interface HubSnapshot {
  version: 1;
  reportedPower: "on" | "off" | "unknown";
  reportedAt: number;
  timers: HubTimer[];
  remoteActions: TvRemoteAction[];
}
export function tvEndpoint(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "192.168.1.3" &&
      Number(url.port) >= 1024 &&
      Number(url.port) <= 65535 &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}
export function hubSnapshot(value: unknown): HubSnapshot {
  const data = value as HubSnapshot;
  if (
    !data ||
    data.version !== 1 ||
    !["on", "off", "unknown"].includes(data.reportedPower) ||
    !Number.isSafeInteger(data.reportedAt) ||
    data.reportedAt < 0
  )
    throw new Error("Unrecognized hub status.");
  // Lua encodes an empty sequence as {}. No other object is accepted as a list.
  const timers = Array.isArray(data.timers)
    ? data.timers
    : data.timers &&
        typeof data.timers === "object" &&
        Object.keys(data.timers).length === 0
      ? []
      : null;
  if (
    !timers ||
    timers.length > 64 ||
    timers.some(
      (timer) =>
        !timer ||
        typeof timer.id !== "string" ||
        !/^[\w-]{16,64}$/.test(timer.id) ||
        !["on", "off"].includes(timer.action) ||
        !Number.isSafeInteger(timer.dueAt) ||
        ![
          "pending",
          "claimed",
          "sent",
          "unknown",
          "cancelled",
          "expired",
        ].includes(timer.status),
    )
  )
    throw new Error("Unrecognized hub timers.");
  const remoteActions =
    data.remoteActions === undefined ||
    (data.remoteActions &&
      typeof data.remoteActions === "object" &&
      !Array.isArray(data.remoteActions) &&
      Object.keys(data.remoteActions).length === 0)
      ? []
      : data.remoteActions;
  if (
    !Array.isArray(remoteActions) ||
    remoteActions.length > tvRemoteActions.length ||
    remoteActions.some((action) => !tvRemoteActions.includes(action)) ||
    new Set(remoteActions).size !== remoteActions.length
  )
    throw new Error("Unrecognized TV remote capabilities.");
  return {
    version: 1,
    reportedPower: data.reportedPower,
    reportedAt: data.reportedAt,
    timers,
    remoteActions,
  };
}
export async function tvRequest(
  endpoint: string,
  path: string,
  data?: Record<string, unknown>,
) {
  if (!tvEndpoint(endpoint))
    throw new Error("Use the verified TV hub address and port.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const response = await fetch(endpoint + path, {
      method: data ? "POST" : "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      ...(data
        ? {
            headers: {
              "Content-Type": "text/plain",
            },
            body: JSON.stringify({ ...data, id }),
          }
        : {}),
    });
    if (!response.ok)
      throw new Error(
        "The hub did not confirm this request. Refresh before retrying.",
      );
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}
