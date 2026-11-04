import { it, expect } from "vitest";
import {
  cookie,
  readSession,
  passwordHash,
  verifyPassword,
  validVerifier,
} from "../../server/auth";
it("verifies a password without retaining it and rejects malformed verifiers", async () => {
  const salt = "0123456789abcdef0123456789abcdef";
  const verifier = `pbkdf2:100000:${salt}:${await passwordHash("test-only-passphrase", salt)}`;
  expect(validVerifier(verifier)).toBe(true);
  expect(await verifyPassword("test-only-passphrase", verifier)).toBe(true);
  expect(await verifyPassword("wrong-passphrase", verifier)).toBe(false);
  expect(await verifyPassword("test-only-passphrase", "bad")).toBe(false);
});
it("only accepts correctly formed opaque sessions and clears with secure cookie flags", () => {
  expect(
    readSession(
      new Request("https://example.com", {
        headers: { Cookie: "__Host-talin-session=bad" },
      }),
    ),
  ).toBeNull();
  const token = "a".repeat(64);
  expect(
    readSession(
      new Request("https://example.com", {
        headers: { Cookie: `__Host-talin-session=${token}; other=value` },
      }),
    ),
  ).toBe(token);
  expect(cookie("", 0)).toContain("Max-Age=0");
  expect(cookie(token)).toContain("HttpOnly; Secure; SameSite=Strict");
});
