import { test, expect } from "@playwright/test";
import { pbkdf2Sync } from "node:crypto";

test("password setup creates a compatible verifier without transmitting or retaining the passphrase", async ({ page }) => {
  await page.goto("/password-setup.html");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const passphrase = "test-only-setup-passphrase";
  await page.getByLabel("Passphrase (12–256 characters)", { exact: true }).fill(passphrase);
  await page.getByLabel("Confirm passphrase", { exact: true }).fill("does-not-match");
  await page.getByRole("button", { name: "Create verifier" }).click();
  await expect(page.getByRole("status")).toContainText("make both entries match");
  await page.getByLabel("Confirm passphrase", { exact: true }).fill(passphrase);
  await page.getByRole("button", { name: "Create verifier" }).click();
  const output = page.getByLabel("Password verifier", { exact: true });
  await expect(output).toHaveValue(/^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);
  const [, , salt, hash] = (await output.inputValue()).split(":");
  expect(hash).toBe(pbkdf2Sync(passphrase, salt, 100000, 32, "sha256").toString("hex"));
  await expect(page.getByLabel("Passphrase (12–256 characters)", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Confirm passphrase", { exact: true })).toHaveValue("");
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.getByRole("button", { name: "Clear this page" }).click();
  await expect(output).toBeHidden();
  await expect(output).toHaveValue("");
  expect(requests).toEqual([]);
});
