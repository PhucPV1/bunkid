import { describe, expect, it } from "vitest";
import type { EpisodeLike } from "./illness";
import {
  episodeReport,
  episodeReportLogs,
  reportSelection,
  symptomRows,
} from "./report";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();
const NOW = vn("2026-11-26 10:00");
const episode = (
  id: string,
  start: string,
  end: string | null = null,
): EpisodeLike => ({
  id,
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});
const OPEN = episode("open", "2026-11-24 23:30");
const PAST = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");
const OLDER = episode("older", "2026-09-01 08:00", "2026-09-03 09:00");

// Spec 2026-11-26 §9: which period and which episode the report shows.
describe("reportSelection", () => {
  const episodes = [OPEN, PAST, OLDER];

  it("without an address or a choice: 7 days", () => {
    expect(reportSelection({ picked: null, address: null, episodes })).toEqual({
      period: "7",
      episode: null,
    });
  });

  it("/bao-cao?dot={id} opens that episode", () => {
    expect(
      reportSelection({ picked: null, address: "past", episodes }),
    ).toEqual({ period: "dot", episode: PAST });
  });

  it("an id the baby's episodes do not hold is as if there were none", () => {
    expect(
      reportSelection({ picked: null, address: "gone", episodes }),
    ).toEqual({ period: "7", episode: null });
  });

  it("picked by hand: the open episode, else the one that started last", () => {
    expect(
      reportSelection({ picked: "dot", address: "past", episodes }),
    ).toEqual({ period: "dot", episode: OPEN });
    expect(
      reportSelection({
        picked: "dot",
        address: null,
        episodes: [OLDER, PAST],
      }),
    ).toEqual({ period: "dot", episode: PAST });
  });

  it("7 or 14 days picked by hand win over the address", () => {
    expect(
      reportSelection({ picked: "14", address: "past", episodes }),
    ).toEqual({ period: "14", episode: null });
  });

  it("not known while the episodes are loading and the address names one", () => {
    expect(
      reportSelection({ picked: null, address: "past", episodes: undefined }),
    ).toBeNull();
    expect(
      reportSelection({ picked: null, address: null, episodes: undefined }),
    ).toEqual({ period: "7", episode: null });
  });

  it("no episode left (deleted meanwhile): back to 7 days", () => {
    expect(
      reportSelection({ picked: "dot", address: null, episodes: [] }),
    ).toEqual({ period: "7", episode: null });
  });
});

// Spec §9: the days, the logs and the line of the "Đợt ốm" period.
describe("episodeReport", () => {
  it("a closed episode: its first to its last day", () => {
    expect(episodeReport(PAST, NOW)).toEqual({
      days: ["2026-10-10", "2026-10-11", "2026-10-12"],
      truncated: false,
      from: iso("2026-10-09 00:00"),
      to: iso("2026-10-13 00:00"),
      line: "Đợt ốm 10/10 – 12/10 · 3 ngày",
    });
  });

  it("an open episode: up to today, with no upper bound on the logs", () => {
    expect(episodeReport(OPEN, NOW)).toEqual({
      days: ["2026-11-24", "2026-11-25", "2026-11-26"],
      truncated: false,
      from: iso("2026-11-23 00:00"),
      to: null,
      line: "Đợt ốm từ 24/11 · ngày thứ 3",
    });
    // A start up to a minute ahead (§5.7) may fall on tomorrow's date just
    // before midnight: the report still has that one day, and does not throw.
    const ahead = episode("ahead", "2026-11-27 00:00");
    expect(episodeReport(ahead, vn("2026-11-26 23:59"))).toEqual({
      days: ["2026-11-27"],
      truncated: false,
      from: iso("2026-11-26 00:00"),
      to: null,
      line: "Đợt ốm từ 27/11 · ngày thứ 1",
    });
  });

  it("longer than 14 days: only the last 14", () => {
    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
    const report = episodeReport(long, NOW);
    expect(report.days).toHaveLength(14);
    expect(report.days[0]).toBe("2026-10-07");
    expect(report.days[13]).toBe("2026-10-20");
    expect(report.truncated).toBe(true);
    expect(report.from).toBe(iso("2026-10-06 00:00"));
    expect(report.line).toBe("Đợt ốm 01/10 – 20/10 · 20 ngày");
  });

  it("exactly 14 days is not cut", () => {
    const fortnight = episode("f", "2026-10-01 08:00", "2026-10-14 09:00");
    expect(episodeReport(fortnight, NOW).truncated).toBe(false);
  });
});

// Spec §9: the table "Triệu chứng", for every period.
describe("symptomRows", () => {
  const from = Date.parse(iso("2026-11-20 00:00"));
  const log = (time: string, details: unknown) => ({
    type: "symptom",
    started_at: iso(time),
    details,
  });

  it("spec 2026-11-27 §6.3: one row per day, oldest first: the day, the short names, the notes", () => {
    expect(
      symptomRows(
        [
          log("2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
          log("2026-11-25 20:00", { codes: ["fussy"], note: "quấy tối" }),
          log("2026-11-25 07:00", { codes: ["runny_nose"], note: "sáng" }),
          log("2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
          log("2026-11-19 09:00", { codes: ["vomit"] }),
          {
            type: "temperature",
            started_at: iso("2026-11-22 08:00"),
            details: { celsius: 38, method: "nach" },
          },
        ],
        from,
      ),
    ).toEqual([
      { at: "21/11", text: "Sốt", note: "quấy cả tối" },
      { at: "25/11", text: "Sổ mũi, Ho, Quấy", note: "sáng · quấy tối" },
    ]);
  });

  it("codes the content no longer has are left out; a broken log is skipped", () => {
    expect(
      symptomRows(
        [
          log("2026-11-21 08:00", { codes: ["gone_code", "cough"] }),
          log("2026-11-22 08:00", { codes: ["gone_code"] }),
          log("2026-11-23 08:00", { codes: [] }),
        ],
        from,
      ),
    ).toEqual([
      { at: "21/11", text: "Ho", note: "" },
      { at: "22/11", text: "", note: "" },
    ]);
  });
});

// Spec 2026-11-27 §6.3: the logs of the episode period of the report.
describe("episodeReportLogs", () => {
  const at = (type: string, time: string) => ({
    type,
    started_at: iso(time),
  });

  it("a symptom log by its calendar day, every other log by its time", () => {
    const logs = [
      at("temperature", "2026-11-24 20:00"),
      at("symptom", "2026-11-24 20:05"),
      at("temperature", "2026-11-24 23:40"),
      at("symptom", "2026-11-23 23:59"),
    ];
    expect(episodeReportLogs(logs, OPEN, NOW)).toEqual([
      at("symptom", "2026-11-24 20:05"),
      at("temperature", "2026-11-24 23:40"),
    ]);
  });
});
