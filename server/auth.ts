export const SESSION_COOKIE = "__Host-talin-session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
export async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
export async function passwordHash(
  password: string,
  salt: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
}
export function validVerifier(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    /^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{64}$/.test(value)
  );
}
export async function verifyPassword(
  password: string,
  verifier: string,
): Promise<boolean> {
  if (!validVerifier(verifier)) return false;
  const [, , salt, expected] = verifier.split(":");
  const actual = await passwordHash(password, salt);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++)
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export function sessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return hex(bytes.buffer);
}
export function cookie(token: string, age = SESSION_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
export function readSession(request: Request): string | null {
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
