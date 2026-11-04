import { randomBytes, pbkdf2Sync } from "node:crypto";
import { stdin, stdout, stderr } from "node:process";
if (!stdin.isTTY) {
  stderr.write(
    "Run this interactively in a trusted terminal. Never put passwords in command arguments.\n",
  );
  process.exit(1);
}
stderr.write("New household passphrase (at least 12 characters, hidden): ");
stdin.setRawMode(true);
stdin.resume();
let password = "";
stdin.on("data", (chunk) => {
  for (const char of chunk.toString()) {
    if (char === "\u0003") {
      stdin.setRawMode(false);
      process.exit(1);
    }
    if (char === "\r" || char === "\n") {
      stdin.setRawMode(false);
      stdin.pause();
      stderr.write("\n");
      if (password.length < 12 || password.length > 256) {
        stderr.write("Passphrase must be 12–256 characters.\n");
        process.exit(1);
      }
      const salt = randomBytes(16).toString("hex");
      const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString(
        "hex",
      );
      password = "";
      stdout.write(`pbkdf2:100000:${salt}:${hash}\n`);
      process.exit(0);
    }
    if (char === "\u007f") password = password.slice(0, -1);
    else if (char >= " ") password += char;
  }
});
