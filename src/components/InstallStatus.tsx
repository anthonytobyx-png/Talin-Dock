import { useEffect, useRef, useState } from "react";
export function InstallStatus() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const applying = useRef(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let active = true;
    let registration: ServiceWorkerRegistration | undefined;
    const workers = new Set<ServiceWorker>();
    const track = () => {
      if (!active || !registration) return;
      if (registration.active) setReady(true);
      if (registration.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
      const worker = registration.installing;
      if (worker && !workers.has(worker)) {
        workers.add(worker);
        worker.addEventListener("statechange", track);
      }
    };
    navigator.serviceWorker
      .register("/sw.js")
      .then((value) => {
        registration = value;
        track();
        value.addEventListener("updatefound", track);
        navigator.serviceWorker.ready.then(() => {
          if (active) setReady(true);
        });
      })
      .catch(() => {
        if (active) setError(true);
      });
    const changed = () => {
      if (active && applying.current) {
        applying.current = false;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    return () => {
      active = false;
      registration?.removeEventListener("updatefound", track);
      for (const worker of workers)
        worker.removeEventListener("statechange", track);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
  }, []);
  if (!import.meta.env.PROD) return null;
  return (
    <div className="install-status" role="status">
      {error
        ? "Offline installation unavailable. Try an online reload in Safari."
        : ready
          ? "Available offline on this device"
          : "Preparing offline dashboard…"}
      {waiting && (
        <button
          onClick={() => {
            applying.current = true;
            waiting.postMessage({ type: "ACTIVATE_UPDATE" });
          }}
        >
          Update app
        </button>
      )}
    </div>
  );
}
