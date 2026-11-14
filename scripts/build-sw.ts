import { readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER = "__CACHE_VERSION__";

export function buildServiceWorker(template: string, version: string): string {
  if (!template.includes(PLACEHOLDER))
    throw new Error(`sw.template.js has no ${PLACEHOLDER}`);
  return template.replaceAll(PLACEHOLDER, version);
}

if (process.argv[1]?.endsWith("build-sw.ts")) {
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  writeFileSync(
    "public/sw.js",
    buildServiceWorker(readFileSync("sw/sw.template.js", "utf8"), version),
  );
  console.log(`public/sw.js written (cache version ${version})`);
}
