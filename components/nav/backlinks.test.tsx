import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const HEALTH = [
  "components/emergency/EmergencyScreen.tsx",
  "components/stats/StatsScreen.tsx",
  "components/growth/GrowthScreen.tsx",
  "components/vaccines/VaccineScreen.tsx",
  "components/milestones/MilestonesScreen.tsx",
  "components/triage/TriageScreen.tsx",
  "components/conditions/ConditionsScreen.tsx",
  "components/report/ReportScreen.tsx",
];
const TOOLS = [
  "components/noise/NoiseScreen.tsx",
  "components/music/MusicScreen.tsx",
  "components/photos/PhotosScreen.tsx",
  "components/holding/HoldingScreen.tsx",
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

// Spec 2026-11-25 §3.2.
describe("back links after the Khám phá tab was split", () => {
  it.each(HEALTH)("%s goes back to Sức khỏe", (path) => {
    expect(read(path)).toContain(
      'back={{ href: "/suc-khoe", label: "Sức khỏe" }}',
    );
  });

  it.each(TOOLS)("%s goes back to Tiện ích", (path) => {
    expect(read(path)).toContain(
      'back={{ href: "/tien-ich", label: "Tiện ích" }}',
    );
  });

  it("no component links to Khám phá or names it any more", () => {
    const stale = sources("components").filter((path) =>
      /kham-pha|Khám phá/.test(read(path)),
    );
    expect(stale).toEqual([]);
  });
});
