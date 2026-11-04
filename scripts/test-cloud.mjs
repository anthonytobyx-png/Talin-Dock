import { spawn } from "node:child_process";
import { pbkdf2Sync } from "node:crypto";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const cli = join(process.cwd(), "node_modules/wrangler/bin/wrangler.js");
const directory = await mkdtemp(join(tmpdir(), "talin-cloud-tests-"));
// This deterministic password is test-only; no production verifier is created.
const password = "local-test-passphrase-only";
const salt = "00000000000000000000000000000000";
const verifier = `pbkdf2:100000:${salt}:${pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex")}`;
const config = join(directory, "wrangler.jsonc");
await symlink(
  join(process.cwd(), "functions"),
  join(directory, "functions"),
  "dir",
);
await writeFile(
  config,
  JSON.stringify({
    name: "talin-dock-tests",
    compatibility_date: "2026-11-01",
    pages_build_output_dir: join(process.cwd(), "dist"),
    vars: { TALIN_PASSWORD_HASH: verifier },
    d1_databases: [
      {
        binding: "DB",
        database_name: "test-only",
        database_id: "00000000-0000-0000-0000-000000000000",
        migrations_dir: join(process.cwd(), "migrations"),
      },
    ],
  }),
);
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      stdio: "inherit",
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_LOG_PATH: join(directory, "wrangler.log"),
      },
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Wrangler exited ${code}`)),
    );
  });
let server;
const clean = async () => {
  server?.kill("SIGTERM");
  await rm(directory, { recursive: true, force: true });
};
process.on("SIGTERM", () => {
  void clean().then(() => process.exit(0));
});
process.on("SIGINT", () => {
  void clean().then(() => process.exit(0));
});
try {
  await run([
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    config,
    "--persist-to",
    directory,
  ]);
  server = spawn(
    process.execPath,
    [
      cli,
      "pages",
      "dev",
      join(process.cwd(), "dist"),
      "--ip",
      "127.0.0.1",
      "--port",
      "8790",
      "--persist-to",
      directory,
    ],
    {
      cwd: directory,
      stdio: "inherit",
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_LOG_PATH: join(directory, "wrangler.log"),
      },
    },
  );
  server.on("exit", (code) => {
    void clean().then(() => process.exit(code || 0));
  });
} catch (error) {
  console.error(error.message);
  await clean();
  process.exit(1);
}
