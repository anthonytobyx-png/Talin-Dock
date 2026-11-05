// This credential permits running saved due timers, never arbitrary device commands.
const encoder = new TextEncoder();
async function signingKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}
export async function timerDispatchHeaders(secret: string, now = Date.now()) {
  const timestamp = String(now);
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret, ["sign"]),
    encoder.encode(timestamp),
  );
  return {
    "X-Talin-Timer-Time": timestamp,
    "X-Talin-Timer-Signature": Array.from(new Uint8Array(signature), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
export async function verifyTimerDispatch(
  request: Request,
  secret?: string,
  now = Date.now(),
) {
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) return false;
  const timestamp = request.headers.get("X-Talin-Timer-Time") || "";
  const signature = request.headers.get("X-Talin-Timer-Signature") || "";
  if (
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 90000 ||
    !/^[0-9a-f]{64}$/i.test(signature)
  )
    return false;
  const bytes = Uint8Array.from(signature.match(/../g)!, (v) =>
    parseInt(v, 16),
  );
  return crypto.subtle.verify(
    "HMAC",
    await signingKey(secret, ["verify"]),
    bytes,
    encoder.encode(timestamp),
  );
}
