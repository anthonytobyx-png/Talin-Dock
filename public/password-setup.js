/* global document, crypto, TextEncoder, navigator, window */
"use strict";
(() => {
  const form = document.getElementById("setup");
  const password = document.getElementById("password");
  const confirmation = document.getElementById("confirmation");
  const status = document.getElementById("status");
  const result = document.getElementById("result");
  const verifier = document.getElementById("verifier");
  const generate = document.getElementById("generate");
  const hex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const clear = () => {
    form.reset();
    verifier.value = "";
    result.hidden = true;
    status.textContent = "";
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (password.value.length < 12 || password.value.length > 256 || password.value !== confirmation.value) {
      status.textContent = "Use 12–256 characters and make both entries match.";
      return;
    }
    generate.disabled = true;
    result.hidden = true;
    verifier.value = "";
    try {
      const encoder = new TextEncoder();
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const key = await crypto.subtle.importKey("raw", encoder.encode(password.value), "PBKDF2", false, ["deriveBits"]);
      const hash = hex(await crypto.subtle.deriveBits({name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256"}, key, 256));
      verifier.value = "pbkdf2:100000:" + salt + ":" + hash;
      form.reset();
      result.hidden = false;
      status.textContent = "Verifier ready. Passphrase fields cleared.";
    } catch {
      status.textContent = "This browser could not create the verifier. Use npm run auth:hash in a trusted terminal instead.";
    } finally {
      generate.disabled = false;
    }
  });
  document.getElementById("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(verifier.value);
      status.textContent = "Verifier copied. Paste it into the Cloudflare secret field.";
    } catch {
      verifier.focus();
      verifier.select();
      status.textContent = "Copy the selected verifier using your browser's Copy action.";
    }
  });
  document.getElementById("clear").addEventListener("click", clear);
  window.addEventListener("pagehide", clear);
})();
