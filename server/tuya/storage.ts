const encoder = new TextEncoder(),
  decoder = new TextDecoder();
function keyBytes(secret: string) {
  if (!/^[0-9a-f]{64}$/i.test(secret))
    throw new Error("Tuya secure storage unavailable");
  return Uint8Array.from(secret.match(/../g)!, (h) => parseInt(h, 16));
}
async function key(secret: string) {
  return crypto.subtle.importKey("raw", keyBytes(secret), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function seal(value: unknown, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: encoder.encode("talin-tuya-v1") },
      await key(secret),
      encoder.encode(JSON.stringify(value)),
    ),
  );
  const bytes = new Uint8Array(iv.length + encrypted.length);
  bytes.set(iv);
  bytes.set(encrypted, iv.length);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}
export async function unseal<T>(value: string, secret: string): Promise<T> {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  return JSON.parse(
    decoder.decode(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: bytes.slice(0, 12),
          additionalData: encoder.encode("talin-tuya-v1"),
        },
        await key(secret),
        bytes.slice(12),
      ),
    ),
  );
}
