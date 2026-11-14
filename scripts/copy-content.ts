import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Spec §12: content/*.vi.json is served at /content/<name>.vi.json (the iOS unit reads it there).
export function copyContent(fromDir: string, toDir: string): string[] {
  mkdirSync(toDir, { recursive: true });
  const files = readdirSync(fromDir).filter((name) =>
    name.endsWith(".vi.json"),
  );
  for (const name of files)
    copyFileSync(join(fromDir, name), join(toDir, name));
  return files;
}

if (process.argv[1]?.endsWith("copy-content.ts")) {
  const files = copyContent("content", "public/content");
  console.log(`public/content: ${files.join(", ")}`);
}
