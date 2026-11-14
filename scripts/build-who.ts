import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { LmsRow } from "@/lib/content/who";

// Spec §7.3: WHO Child Growth Standards, expanded LMS tables by day of age 0–1856.
const CDN =
  "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators";

export const WHO_FILES = [
  {
    indicator: "wfa",
    sex: "boys",
    unit: "kg",
    url: `${CDN}/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "wfa",
    sex: "girls",
    unit: "kg",
    url: `${CDN}/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "lhfa",
    sex: "boys",
    unit: "cm",
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "lhfa",
    sex: "girls",
    unit: "cm",
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-girls-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "hcfa",
    sex: "boys",
    unit: "cm",
    url: `${CDN}/head-circumference-for-age/expanded-tables/hcfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "hcfa",
    sex: "girls",
    unit: "cm",
    url: `${CDN}/head-circumference-for-age/expanded-tables/hcfa-girls-zscore-expanded-tables.xlsx`,
  },
] as const;

const num = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error(`not a number: ${String(value)}`);
  return n;
};

// Reads the first sheet: header "Day, L, M, S, …", one row per day.
export async function readLmsRows(path: string): Promise<LmsRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.worksheets[0];
  const header = (sheet.getRow(1).values as unknown[]).slice(1, 5);
  if (header.join(",") !== "Day,L,M,S")
    throw new Error(`${path}: unexpected header ${header.join(",")}`);
  const rows: LmsRow[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const [day, l, m, s] = (row.values as unknown[]).slice(1, 5).map(num);
    rows.push([day, l, m, s]);
  });
  rows.forEach(([day], i) => {
    if (day !== i) throw new Error(`${path}: day ${day} at row ${i}`);
  });
  return rows;
}

// Usage: bun scripts/build-who.ts <folder with the six .xlsx files> <reviewedAt YYYY-MM-DD>
if (process.argv[1]?.endsWith("build-who.ts")) {
  const [from, reviewedAt] = process.argv.slice(2);
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt ?? ""))
    throw new Error(
      "usage: bun scripts/build-who.ts <xlsx folder> <YYYY-MM-DD>",
    );
  mkdirSync("content/who", { recursive: true });
  for (const file of WHO_FILES) {
    const rows = await readLmsRows(
      join(from, file.url.split("/").pop() as string),
    );
    const out = `content/who/${file.indicator}_${file.sex}.json`;
    const { indicator, sex, unit, url } = file;
    const table = { indicator, sex, unit, source: url, reviewedAt, rows };
    writeFileSync(out, `${JSON.stringify(table)}\n`);
    console.log(`${out}: ${rows.length} days`);
  }
}
