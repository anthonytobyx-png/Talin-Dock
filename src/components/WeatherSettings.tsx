import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "../state/Store";
import { useWeather } from "../data/WeatherContext";
import { searchLocations } from "../data/weather";
import type { WeatherLocation } from "../state/model";
import { Panel } from "./primitives";
export function WeatherSettings() {
  const { state, dispatch } = useStore();
  const { refresh } = useWeather();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController>();
  useEffect(() => () => request.current?.abort(), []);
  async function search(event: FormEvent) {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    setBusy(true);
    setMessage("Searching…");
    setResults([]);
    try {
      const found = await searchLocations(query, controller.signal);
      setResults(found);
      setMessage(
        found.length
          ? "Choose a location."
          : "No locations found. Try a nearby town.",
      );
    } catch {
      setMessage(
        "Location search could not be reached. Your current location is unchanged.",
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }
  return (
    <Panel title="Household weather">
      <p>
        Current location:{" "}
        <strong>
          {state.household.weatherLocation?.name || "Not configured"}
        </strong>
      </p>
      <p>
        Weather uses Open-Meteo’s free service for personal, non-commercial use.
        The town coordinates are sent to Open-Meteo; precise device location is
        never requested.
      </p>
      <form onSubmit={search}>
        <label className="field">
          Town or city
          <input
            minLength={2}
            maxLength={100}
            required
            value={query}
            placeholder="Monaghan"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          Search locations
        </button>
      </form>
      <p role="status">{message}</p>
      {results.map((location) => (
        <button
          key={`${location.latitude},${location.longitude}`}
          className="profile-row"
          onClick={() => {
            dispatch({
              type: "household",
              patch: { weatherLocation: location },
            });
            setResults([]);
            setMessage(`Weather set to ${location.name}.`);
          }}
        >
          {location.name}
        </button>
      ))}
      <div className="button-row">
        <button onClick={refresh} disabled={!state.household.weatherLocation}>
          Refresh weather
        </button>
        <button
          onClick={() =>
            dispatch({ type: "household", patch: { weatherLocation: null } })
          }
        >
          Turn weather off
        </button>
      </div>
      <a
        className="store-link"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
      >
        Weather data by Open-Meteo · CC BY 4.0
      </a>
    </Panel>
  );
}
