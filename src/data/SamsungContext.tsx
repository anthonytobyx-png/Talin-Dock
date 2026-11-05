import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  defaultTvEndpoint,
  hubSnapshot,
  tvEndpoint,
  tvRequest,
  type HubSnapshot,
} from "../integrations/smartthingsLocal";
const storageKey = "talin-tv-hub-endpoint";
function initialEndpoint() {
  try {
    return (
      tvEndpoint(localStorage.getItem(storageKey) || "") || defaultTvEndpoint
    );
  } catch {
    return defaultTvEndpoint;
  }
}
interface ContextValue {
  endpoint: string;
  configure: (value: string) => boolean;
  snapshot?: HubSnapshot;
  ready: boolean;
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  perform: (path: string, data: Record<string, unknown>) => Promise<boolean>;
}
const Context = createContext<ContextValue>({
  endpoint: defaultTvEndpoint,
  configure: () => false,
  ready: false,
  busy: false,
  error: "",
  refresh: async () => {},
  perform: async () => false,
});
export function SamsungProvider({ children }: { children: ReactNode }) {
  const [endpoint, setEndpoint] = useState(initialEndpoint),
    [snapshot, setSnapshot] = useState<HubSnapshot>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [lastSeen, setLastSeen] = useState(0),
    [now, setNow] = useState(Date.now);
  const current = useRef(endpoint),
    pending = useRef(false),
    generation = useRef(0);
  current.current = endpoint;
  const refresh = useCallback(async () => {
    if (pending.current) return;
    if (!navigator.onLine) {
      setError(
        "Offline. TV requests need Wi-Fi and internet for the native SmartThings rules.",
      );
      return;
    }
    pending.current = true;
    const target = endpoint,
      requestGeneration = generation.current;
    try {
      const next = hubSnapshot(await tvRequest(target, "/v1/status"));
      if (
        current.current !== target ||
        requestGeneration !== generation.current
      )
        return;
      setSnapshot(next);
      setLastSeen(Date.now());
      setNow(Date.now());
      setError("");
    } catch {
      if (
        current.current === target &&
        requestGeneration === generation.current
      )
        setError(
          "Hub unavailable. Check home Wi-Fi, the installed Talin certificates and the hub port. Previous TV reports are stale.",
        );
    } finally {
      pending.current = false;
    }
  }, [endpoint]);
  useEffect(() => {
    void refresh();
    const visible = () => {
      setNow(Date.now());
      if (!document.hidden) void refresh();
    };
    const offline = () => {
      generation.current++;
      setLastSeen(0);
      setError(
        "Offline. Previous TV reports are stale; controls are unavailable.",
      );
    };
    const timer = setInterval(visible, 30000);
    window.addEventListener("online", visible);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", visible);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  function configure(value: string) {
    const valid = tvEndpoint(value.trim());
    if (!valid) return false;
    generation.current++;
    current.current = valid;
    setEndpoint(valid);
    setSnapshot(undefined);
    setLastSeen(0);
    setError("");
    try {
      localStorage.setItem(storageKey, valid);
    } catch {
      /* Routing preference only; never credentials. */
    }
    return true;
  }
  const ready =
    !!snapshot && !error && navigator.onLine && now - lastSeen < 60000;
  async function perform(path: string, data: Record<string, unknown>) {
    if (!ready || busy) return false;
    setBusy(true);
    try {
      await tvRequest(endpoint, path, data);
      await refresh();
      return true;
    } catch {
      setError(
        "Request outcome unknown. Refresh hub status before retrying; the request may already have arrived.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        endpoint,
        configure,
        snapshot,
        ready,
        busy,
        error,
        refresh,
        perform,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSamsung() {
  return useContext(Context);
}
