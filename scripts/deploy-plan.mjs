import { parse } from "jsonc-parser";
import { existsSync, readFileSync } from "node:fs";
const hasToken = Boolean(process.env.CLOUDFLARE_API_TOKEN);
const config = parse(readFileSync("wrangler.jsonc", "utf8"));
const id = config.d1_databases?.[0]?.database_id;
console.log("Cloudflare Pages Free + D1 Free deployment readiness");
console.log(
  `API token binding: ${hasToken ? "present (authorisation still needs verification)" : "missing; use secure environment settings"}`,
);
console.log(
  `D1 binding: ${id && !id.startsWith("00000000") ? "configured; verify account ownership" : "local-only placeholder; create a cloud database first"}`,
);
console.log(
  `Production assets: ${existsSync("dist/sw.js") ? "built" : "run npm run build"}`,
);
console.log(
  "No external action was performed. Follow DEPLOYMENT.md after authentication. Never deploy the test harness or its test-only password.",
);
