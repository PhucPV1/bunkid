import { describe, expect, it } from "vitest";
import { type HomeAlert, homeAlerts } from "./alerts";
import type { LogLike } from "./describeLog";
import { type EpisodeLike, inviteAlert, inviteStartedAt } from "./illness";

// Vietnam time, written the way a parent reads the clock.
const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();

const episode = (
  start: string,
  end: string | null = null,
  id = "ep1",
): EpisodeLike => ({
  id,
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});

const at = (type: string, time: string, details: unknown): LogLike => ({
  type,
  started_at: iso(time),
  ended_at: iso(time),
  details,
});
const temp = (time: string, celsius: number) =>
  at("temperature", time, { celsius, method: "nach" });

// Spec §4.2: the rules may not lean on the order of the array. Every order of
// `logs` must give the same answer.
function orders(logs: LogLike[]): LogLike[][] {
  const ascending = [...logs].sort((a, b) =>
    a.started_at.localeCompare(b.started_at),
  );
  // Odd places first, then the even ones backwards: neither sorted way.
  const shuffled = [
    ...ascending.filter((_, index) => index % 2 === 1),
    ...ascending.filter((_, index) => index % 2 === 0).reverse(),
  ];
  return [ascending, [...ascending].reverse(), shuffled];
}
function sameForEveryOrder<T>(
  logs: LogLike[],
  rule: (logs: LogLike[]) => T,
): T {
  const [first, ...rest] = orders(logs).map(rule);
  for (const other of rest) expect(other).toEqual(first);
  return first;
}

const NOW = vn("2026-11-27 12:00");
const HOUR = 3_600_000;
const past = episode("2026-11-20 08:00", "2026-11-27 09:00", "past");

// The banners of the home page, for a baby of eight months unless said.
const banners = (logs: LogLike[], ageDays = 240): HomeAlert[] =>
  homeAlerts({
    logs,
    ageDays,
    wetDiapers: { status: "no-data" },
    triageAvailable: true,
    now: NOW,
  });

// Spec 2026-11-26 §5.5: the invite to start an episode rides on the fever
// banner. The answer is the key of that banner, or null.
describe("inviteAlert", () => {
  const invite = (
    logs: LogLike[],
    over: {
      episodes?: EpisodeLike[];
      dismissedAt?: number | null;
      ageDays?: number;
    } = {},
  ) =>
    sameForEveryOrder(logs, (ordered) =>
      inviteAlert({
        episodes: over.episodes ?? [],
        alerts: banners(ordered, over.ageDays),
        logs: ordered,
        dismissedAt: over.dismissedAt ?? null,
        now: NOW,
      }),
    );

  it("rides on the yellow fever banner and on both red ones", () => {
    expect(invite([temp("2026-11-27 11:00", 38.6)])).toBe("fever");
    expect(invite([temp("2026-11-27 11:00", 38.6)], { ageDays: 60 })).toBe(
      "fever-infant",
    );
    expect(invite([temp("2026-11-27 11:00", 40.2)])).toBe("fever-high");
  });

  it("stays away without a fever banner", () => {
    expect(invite([])).toBeNull();
    expect(invite([temp("2026-11-27 11:00", 37.4)])).toBeNull();
    // Older than the banner's six hours.
    expect(invite([temp("2026-11-27 05:59", 39)])).toBeNull();
    // A newer reading without fever takes the banner away.
    expect(
      invite([temp("2026-11-27 10:00", 39), temp("2026-11-27 11:00", 37.2)]),
    ).toBeNull();
    // The low-temperature banner and the stool banners are not fever banners.
    expect(invite([temp("2026-11-27 11:00", 35)])).toBeNull();
    expect(
      invite([
        at("diaper", "2026-11-27 11:00", {
          wet: false,
          dirty: true,
          stoolColor: "pale",
        }),
      ]),
    ).toBeNull();
  });

  it("stays away while the baby has an open episode", () => {
    const logs = [temp("2026-11-27 11:00", 38.6)];
    expect(
      invite(logs, { episodes: [past, episode("2026-11-27 09:30")] }),
    ).toBeNull();
    expect(invite(logs, { episodes: [past] })).toBe("fever");
  });

  it("stays away when the reading behind the banner is from before the latest end", () => {
    // Bé đã khỏi was pressed at 09:00; the fever of 08:30 is inside that episode.
    expect(
      invite([temp("2026-11-27 08:30", 38.6)], { episodes: [past] }),
    ).toBeNull();
    // Taken at the very moment of the end: still that episode's.
    expect(
      invite([temp("2026-11-27 09:00", 38.6)], { episodes: [past] }),
    ).toBeNull();
    expect(invite([temp("2026-11-27 09:01", 38.6)], { episodes: [past] })).toBe(
      "fever",
    );
    // The latest end counts, wherever that episode sits in the list.
    const older = episode("2026-11-01 08:00", "2026-11-03 08:00", "older");
    expect(
      invite([temp("2026-11-27 08:30", 38.6)], { episodes: [older, past] }),
    ).toBeNull();
  });

  it("stays away for 24 hours after Không on this device", () => {
    const logs = [temp("2026-11-27 11:00", 38.6)];
    const ago = (ms: number) => NOW.getTime() - ms;
    expect(invite(logs, { dismissedAt: ago(0) })).toBeNull();
    expect(invite(logs, { dismissedAt: ago(24 * HOUR - 1) })).toBeNull();
    expect(invite(logs, { dismissedAt: ago(24 * HOUR) })).toBe("fever");
    // The tap is stamped with the real time, a moment after the page's clock.
    expect(invite(logs, { dismissedAt: ago(-900) })).toBeNull();
    // A stamp from a clock that once ran more than a day ahead is not kept.
    expect(invite(logs, { dismissedAt: ago(-24 * HOUR) })).toBe("fever");
  });
});

// Spec §5.5 "Bắt đầu đợt ốm": where the new episode starts.
describe("inviteStartedAt", () => {
  const startedAt = (logs: LogLike[], episodes: EpisodeLike[] = []) =>
    sameForEveryOrder(logs, (ordered) =>
      inviteStartedAt(ordered, episodes, NOW),
    );

  it("is the time of the earliest reading from 38,0 in the last 48 hours", () => {
    expect(
      startedAt([
        temp("2026-11-26 07:00", 37.4),
        temp("2026-11-26 20:15", 38),
        temp("2026-11-27 02:00", 39.4),
        temp("2026-11-27 11:00", 38.6),
        at("symptom", "2026-11-26 06:00", { codes: ["cough"] }),
        // Not a valid reading.
        at("temperature", "2026-11-26 05:00", { celsius: "nóng" }),
      ]),
    ).toBe(iso("2026-11-26 20:15"));
  });

  it("looks back 48 hours and not a minute more", () => {
    expect(
      startedAt([
        temp("2026-11-25 11:59", 39),
        temp("2026-11-25 12:00", 38.2),
        temp("2026-11-27 11:00", 38.6),
      ]),
    ).toBe(iso("2026-11-25 12:00"));
  });

  it("only counts readings after the latest end of the baby's episodes", () => {
    const older = episode("2026-11-01 08:00", "2026-11-03 08:00", "older");
    const logs = [
      temp("2026-11-26 20:15", 38.9),
      temp("2026-11-27 09:00", 38.4),
      temp("2026-11-27 11:00", 38.6),
    ];
    expect(startedAt(logs, [past, older])).toBe(iso("2026-11-27 11:00"));
    expect(startedAt(logs, [older])).toBe(iso("2026-11-26 20:15"));
  });

  it("is now when no such reading is left", () => {
    expect(startedAt([])).toBe(NOW.toISOString());
    expect(startedAt([temp("2026-11-27 11:00", 37.4)])).toBe(NOW.toISOString());
    expect(startedAt([temp("2026-11-27 08:30", 38.6)], [past])).toBe(
      NOW.toISOString(),
    );
    // A reading dated after now is not one of the last 48 hours.
    expect(startedAt([temp("2026-11-27 12:01", 38.6)])).toBe(NOW.toISOString());
  });
});
