// Tuya device-sharing protocol, adapted from Tuya's MIT-licensed SDK.
// See NOTICE.md. MD5 is required by this protocol; it is not used for storage/authentication.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export function md5(input: string) {
  const source = encoder.encode(input),
    length = Math.ceil((source.length + 9) / 64) * 64;
  const bytes = new Uint8Array(length);
  bytes.set(source);
  bytes[source.length] = 128;
  const view = new DataView(bytes.buffer);
  view.setUint32(length - 8, source.length * 8, true);
  view.setUint32(length - 4, Math.floor(source.length / 536870912), true);
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const shifts = [
    [7, 12, 17, 22],
    [5, 9, 14, 20],
    [4, 11, 16, 23],
    [6, 10, 15, 21],
  ];
  for (let offset = 0; offset < length; offset += 64) {
    let [a, b, c, d] = state;
    for (let i = 0; i < 64; i++) {
      const round = Math.floor(i / 16);
      const f =
        round === 0
          ? (b & c) | (~b & d)
          : round === 1
            ? (d & b) | (~d & c)
            : round === 2
              ? b ^ c ^ d
              : c ^ (b | ~d);
      const g =
        round === 0
          ? i
          : round === 1
            ? (5 * i + 1) % 16
            : round === 2
              ? (3 * i + 5) % 16
              : (7 * i) % 16;
      const value =
        (a +
          f +
          (Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0) +
          view.getUint32(offset + g * 4, true)) |
        0;
      const shift = shifts[round][i % 4],
        next = (b + ((value << shift) | (value >>> (32 - shift)))) | 0;
      a = d;
      d = c;
      c = b;
      b = next;
    }
    [a, b, c, d].forEach((v, i) => (state[i] = (state[i] + v) | 0));
  }
  const output = new DataView(new ArrayBuffer(16));
  state.forEach((v, i) => output.setUint32(i * 4, v, true));
  return hex(output.buffer);
}
async function hmac(key: string, message: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", k, encoder.encode(message)));
}
function base64(bytes: Uint8Array) {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}
function unbase64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function aesKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptRequest(value: unknown, secret: string) {
  const alphabet = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  const nonce = Uint8Array.from(
    crypto.getRandomValues(new Uint8Array(12)),
    (b) => alphabet.charCodeAt(b % alphabet.length),
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    await aesKey(secret),
    encoder.encode(JSON.stringify(value)),
  );
  return base64(nonce) + base64(new Uint8Array(encrypted));
}
export async function decryptResponse(
  value: string,
  secret: string,
): Promise<unknown> {
  const bytes = unbase64(value);
  const plain = decoder.decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.slice(0, 12) },
      await aesKey(secret),
      bytes.slice(12),
    ),
  );
  try {
    return JSON.parse(plain);
  } catch {
    return plain;
  }
}
export interface TuyaToken {
  t: number;
  expire_time: number;
  uid: string;
  access_token: string;
  refresh_token: string;
}
export interface TuyaCredentials {
  userCode: string;
  endpoint: string;
  terminalId: string;
  token: TuyaToken;
  deviceId: string;
}
const endpoints = new Set([
  "https://apigw.tuyaeu.com",
  "https://apigw.tuyaus.com",
  "https://apigw.tuyacn.com",
  "https://apigw.tuyain.com",
  "https://apigw-ueaz.tuyaus.com",
  "https://apigw-weaz.tuyaeu.com",
]);
export function validEndpoint(value: string) {
  return endpoints.has(value);
}
export const CLIENT_ID = "HA_3y9q4ak7g4ephrvke";
export async function signedRequest(
  credentials: TuyaCredentials,
  method: "GET" | "POST",
  path: string,
  query?: Record<string, string>,
  body?: unknown,
  request: typeof fetch = fetch,
): Promise<{ result: unknown; t: number }> {
  if (!validEndpoint(credentials.endpoint) || !path.startsWith("/v1."))
    throw new Error("Unsupported Tuya endpoint");
  const rid = crypto.randomUUID(),
    hash = md5(rid + credentials.token.refresh_token),
    secret = (await hmac(rid, hash)).slice(0, 16);
  const encQuery = query ? await encryptRequest(query, secret) : "",
    encBody = body ? await encryptRequest(body, secret) : "";
  const headers: Record<string, string> = {
    "X-appKey": CLIENT_ID,
    "X-requestId": rid,
    "X-sid": "",
    "X-time": String(Date.now()),
    "X-token": credentials.token.access_token,
  };
  headers["X-sign"] = await hmac(
    hash,
    ["X-appKey", "X-requestId", "X-sid", "X-time", "X-token"]
      .filter((k) => headers[k])
      .map((k) => `${k}=${headers[k]}`)
      .join("||") +
      encQuery +
      encBody,
  );
  const url = new URL(path, credentials.endpoint);
  if (encQuery) url.searchParams.set("encdata", encQuery);
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await request(url, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      body: encBody ? JSON.stringify({ encdata: encBody }) : undefined,
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Tuya request unavailable");
    const data = (await response.json()) as {
      success?: boolean;
      result?: unknown;
      t?: number;
    };
    if (data.success !== true)
      throw new Error("Tuya request was not acknowledged");
    const result =
      typeof data.result === "string" && data.result
        ? await decryptResponse(data.result, secret)
        : data.result;
    return { result, t: data.t || Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}
export async function refreshToken(
  credentials: TuyaCredentials,
  save: (token: TuyaToken) => Promise<void>,
) {
  if (
    credentials.token.t + credentials.token.expire_time * 1000 - 60000 >
    Date.now()
  )
    return;
  const response = await signedRequest(
    credentials,
    "GET",
    `/v1.0/m/token/${encodeURIComponent(credentials.token.refresh_token)}`,
  );
  const data = response.result as Record<string, unknown>;
  if (
    !data ||
    typeof data.accessToken !== "string" ||
    typeof data.refreshToken !== "string" ||
    typeof data.expireTime !== "number" ||
    typeof data.uid !== "string"
  )
    throw new Error("Tuya reconnect required");
  const token = {
    t: response.t,
    expire_time: data.expireTime,
    uid: data.uid,
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  };
  await save(token);
  credentials.token = token;
}
