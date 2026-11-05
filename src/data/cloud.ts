import type { AppState } from "../state/model";
export class CloudError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function cloudRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`/api/${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Talin-Request": "1",
        ...options.headers,
      },
    });
    let value;
    try {
      value = await response.json();
    } catch {
      throw new CloudError("Cloud service is unavailable on this host.", 503);
    }
    if (!response.ok)
      throw new CloudError(
        value.error || "Cloud request failed",
        response.status,
      );
    if (path === "login" || path === "logout")
      window.dispatchEvent(new Event("talin-session-changed"));
    return value;
  } catch (error) {
    if (error instanceof CloudError) throw error;
    throw new CloudError(
      "Could not reach cloud storage. Local preferences are safe.",
      503,
    );
  } finally {
    clearTimeout(timer);
  }
}
export interface CloudSnapshot {
  state: AppState | null;
  revision: number;
  updatedAt: number | null;
}
