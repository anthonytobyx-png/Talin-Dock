import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Resource, Weather } from "./resources";
import { cachedWeather, getForecast } from "./weather";
import { useStore } from "../state/Store";
const Context = createContext<{
  resource: Resource<Weather>;
  refresh: () => void;
}>({ resource: { status: "not-configured" }, refresh: () => {} });
export function WeatherContext({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const location = state.household.weatherLocation;
  const [resource, setResource] = useState<Resource<Weather>>(() =>
    location
      ? cachedWeather(location) || { status: "loading" }
      : { status: "not-configured" },
  );
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    if (!location) {
      setResource({ status: "not-configured" });
      return;
    }
    const controller = new AbortController();
    setResource(cachedWeather(location) || { status: "loading" });
    let pending = false;
    const read = async () => {
      if (document.hidden || pending || controller.signal.aborted) return;
      pending = true;
      try {
        const result = await getForecast(location, controller.signal);
        if (!controller.signal.aborted) setResource(result);
      } catch {
        /* Unmount aborted the request. */
      } finally {
        pending = false;
      }
    };
    void read();
    const timer = setInterval(
      () => {
        void read();
      },
      15 * 60 * 1000,
    );
    const visible = () => {
      if (!document.hidden) void read();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", visible);
    };
  }, [location, revision]);
  return (
    <Context.Provider value={{ resource, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useWeather = () => useContext(Context);
