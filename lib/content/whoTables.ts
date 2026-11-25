import hcfaBoys from "@/content/who/hcfa_boys.json";
import hcfaGirls from "@/content/who/hcfa_girls.json";
import lhfaBoys from "@/content/who/lhfa_boys.json";
import lhfaGirls from "@/content/who/lhfa_girls.json";
import wfaBoys from "@/content/who/wfa_boys.json";
import wfaGirls from "@/content/who/wfa_girls.json";
import type { LmsRow, WhoIndicator, WhoSex } from "./who";

export type WhoTables = Record<WhoSex, Record<WhoIndicator, LmsRow[]>>;

// All six tables at once (about 290 KB). Only the push dispatcher on the
// server imports this module; the pages load one table at a time through
// loadWhoTable.
export const WHO_TABLES: WhoTables = {
  boys: {
    wfa: wfaBoys.rows as LmsRow[],
    lhfa: lhfaBoys.rows as LmsRow[],
    hcfa: hcfaBoys.rows as LmsRow[],
  },
  girls: {
    wfa: wfaGirls.rows as LmsRow[],
    lhfa: lhfaGirls.rows as LmsRow[],
    hcfa: hcfaGirls.rows as LmsRow[],
  },
};
