import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { devices as defaults, type Device } from "../devices/model";
import type { TuyaSnapshot } from "../devices/tuya";
export async function tuyaRequest<T>(
  path = "",
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 45000);
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(`/api/tuya${path}`, {
      method: data ? "POST" : "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "X-Talin-Request": "1" },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.status === 401)
      throw new Error("Sign in to household cloud storage in Settings.");
    if (!response.ok)
      throw new Error(
        "The Smart Life request was not confirmed. Refresh before retrying.",
      );
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
interface Data {
  available: boolean;
  connected: boolean;
  state?: TuyaSnapshot;
  timerReady?: boolean;
  error?: string;
}
interface ContextValue extends Data {
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}
const Context = createContext<ContextValue>({
  available: false,
  connected: false,
  loading: false,
  error: "",
  refresh: async () => {},
});
export function TuyaProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>({
      available: false,
      connected: false,
    }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async (): Promise<void> => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    const current = generation.current;
    try {
      const next = await tuyaRequest<Data>();
      if (current === generation.current) {
        setData((previous) => ({
          ...next,
          state: next.state || (next.connected ? previous.state : undefined),
        }));
        setError(next.error || "");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Smart Life unavailable";
      if (current !== generation.current) return;
      setError(
        message.startsWith("Sign in")
          ? message
          : "Smart Life is unavailable. Any previous reading is stale; refresh before using controls.",
      );
      if (message.startsWith("Sign in"))
        setData({ available: false, connected: false });
    } finally {
      pending.current = false;
      setLoading(false);
      if (current !== generation.current) void refresh();
    }
  }, []);
  useEffect(() => {
    void refresh();
    const visible = () => {
      if (!document.hidden && navigator.onLine) void refresh();
    };
    const session = () => {
      generation.current++;
      setData({ available: false, connected: false });
      void refresh();
    };
    const timer = setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    window.addEventListener("talin-device-changed", visible);
    window.addEventListener("talin-session-changed", session);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", visible);
      window.removeEventListener("talin-device-changed", visible);
      window.removeEventListener("talin-session-changed", session);
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ ...data, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useTuya() {
  return useContext(Context);
}
export function useDevices(): Device[] {
  const connection = useTuya(),
    snapshot = connection.state;
  return defaults.map((device) => {
    if (device.id !== "tuya-dehumidifier" || !connection.connected || !snapshot)
      return device;
    return {
      ...device,
      adapterId: "tuya-sharing",
      status: connection.error
        ? "unavailable"
        : snapshot.online
          ? "online"
          : "offline",
      updatedAt: snapshot.observedAt,
      confirmedCapabilities: [
        ...(snapshot.humidity !== null ? ["humidity" as const] : []),
        ...(snapshot.canPower ? ["power" as const] : []),
        ...(connection.timerReady ? ["powerTimer" as const] : []),
      ],
      readings:
        snapshot.humidity !== null ? { humidity: snapshot.humidity } : {},
      dataSource: "Smart Life cloud",
      measurementTimeUnknown: true,
      powerState: snapshot.power,
      powerTimer: connection.timerReady
        ? { executor: "service", minSeconds: 120, maxSeconds: 86400 }
        : undefined,
    };
  });
}
