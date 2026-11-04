import { useState } from "react";
import { Panel } from "./primitives";
const providers = {
  Google: {
    title: "Google Calendar",
    method: "Read-only OAuth connection",
    detail:
      "Authorise selected calendars through Google. A registered OAuth client and approved redirect URL are required; your Google password never belongs in Talin Dock.",
  },
  iCloud: {
    title: "iCloud Calendar",
    method: "Private server-side CalDAV connection",
    detail:
      "iCloud requires a reviewed CalDAV connector and an app-specific password, or a private subscription feed. Either is a credential and must stay in encrypted server storage, never in browser preferences. Native iPad calendar access is unavailable.",
  },
  Outlook: {
    title: "Outlook / Microsoft 365",
    method: "Read-only Microsoft Graph connection",
    detail:
      "Authorise selected calendars through Microsoft. An Entra application and redirect URL are required. Start with delegated read-only calendar access.",
  },
};
export function CalendarConnections() {
  const [selected, setSelected] = useState<keyof typeof providers>("Google");
  const provider = providers[selected];
  return (
    <Panel title="Calendar providers">
      <div className="segments calendar-providers">
        {(Object.keys(providers) as (keyof typeof providers)[]).map((name) => (
          <button
            key={name}
            aria-pressed={selected === name}
            onClick={() => setSelected(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <h3>{provider.title}</h3>
      <span className="badge">Not connected</span>
      <p>{provider.method}</p>
      <p>{provider.detail}</p>
      <p>
        Provider connection needs the deployed, authenticated service and the
        owner’s authorisation. No events are fetched or stored in this build.
      </p>
      <p>
        Display profiles are not separate accounts. Calendar sharing and
        busy-only privacy must be enforced on the server before private events
        are introduced.
      </p>
    </Panel>
  );
}
