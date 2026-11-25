import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { AdultHeight } from "@/lib/content/adultHeight";
import type { LmsRow, WhoSex } from "@/lib/content/who";

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

// Spec 2026-11-25 §6.2: WHO Growth Reference 2007, height-for-age 5–19 years,
// expanded z-score tables by month of age 61–228.
const REFERENCE_PAGE =
  "https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/height-for-age";
const REFERENCE_CDN =
  "https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/height-for-age-(5-19-years)";

export const ADULT_HEIGHT_FILES = [
  { sex: "boys", url: `${REFERENCE_CDN}/hfa-boys-z-who-2007-exp.xlsx` },
  { sex: "girls", url: `${REFERENCE_CDN}/hfa-girls-z-who-2007-exp.xlsx` },
] as const;

// 19 years: the last month of the reference.
export const ADULT_MONTH = 228;
// The median the reference is known to end at. A table that gives anything
// else is the wrong file or a changed one.
const ADULT_M_RANGE: Record<WhoSex, [min: number, max: number]> = {
  boys: [176, 177],
  girls: [162.7, 163.7],
};

// `rows` are [month, L, M, S]. Throws instead of writing a wrong constant.
export function adultLms(rows: number[][], sex: WhoSex): AdultHeight[WhoSex] {
  const row = rows.find(([month]) => month === ADULT_MONTH);
  if (!row) throw new Error(`${sex}: no row for month ${ADULT_MONTH}`);
  const [, l, m, s] = row;
  const [min, max] = ADULT_M_RANGE[sex];
  if (m < min || m > max)
    throw new Error(
      `${sex}: M at ${ADULT_MONTH} months is ${m}, outside ${min}–${max} cm. Stop and tell the user.`,
    );
  return { l, m, s };
}

// Reads the first sheet: header "Month, L, M, S, …", one row per month.
export async function readMonthRows(path: string): Promise<number[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.worksheets[0];
  const header = (sheet.getRow(1).values as unknown[]).slice(1, 5);
  if (header.join(",") !== "Month,L,M,S")
    throw new Error(`${path}: unexpected header ${header.join(",")}`);
  const rows: number[][] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    rows.push((row.values as unknown[]).slice(1, 5).map(num));
  });
  return rows;
}

// Usage:
//   bun scripts/build-who.ts <folder with the six .xlsx files> <reviewedAt YYYY-MM-DD>
//   bun scripts/build-who.ts adult <folder with the two hfa .xlsx files> <reviewedAt YYYY-MM-DD>
if (process.argv[1]?.endsWith("build-who.ts")) {
  const args = process.argv.slice(2);
  const adult = args[0] === "adult";
  const [from, reviewedAt] = adult ? args.slice(1) : args;
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt ?? ""))
    throw new Error(
      "usage: bun scripts/build-who.ts [adult] <xlsx folder> <YYYY-MM-DD>",
    );
  mkdirSync("content/who", { recursive: true });
  if (adult) {
    const [boys, girls] = await Promise.all(
      ADULT_HEIGHT_FILES.map(async (file) =>
        adultLms(
          await readMonthRows(join(from, file.url.split("/").pop() as string)),
          file.sex,
        ),
      ),
    );
    const out = "content/who/adult_height.json";
    const table: AdultHeight = {
      source: REFERENCE_PAGE,
      reviewedAt,
      boys,
      girls,
    };
    writeFileSync(out, `${JSON.stringify(table, null, 2)}\n`);
    console.log(`${out}: boys M ${boys.m}, girls M ${girls.m}`);
  }
  for (const file of adult ? [] : WHO_FILES) {
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
