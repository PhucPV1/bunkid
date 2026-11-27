import { TRIAGE } from "@/lib/content/triage";
import { formatDayFull, formatDayShort } from "./days";
import type { LogLike } from "./describeLog";
import {
  antipyreticTimes,
  type CloseCase,
  type DayLabel,
  type EpisodeLike,
  episodeDayCount,
  episodeDays,
  type EpisodeTone,
  episodeVerdict,
  feverStatus,
  formatCelsius,
  sinceText,
  statusTone,
  usualComparison,
  type UsualKey,
  type UsualVerdict,
  type Verdict,
} from "./illness";
import { symptomShorts } from "./symptomForm";
import { formatVnTime, vnDateString } from "./time";
import { hasFever } from "./triage";

// Spec 2026-11-26 §6: the words of the list and of an episode's page. The
// rules themselves are in illness.ts.

// Spec §6.1: the id travels as a query parameter, so both pages stay static
// and work offline.
export function episodeHref(id: string): string {
  return `/dot-om/chi-tiet?id=${id}`;
}

const dayOf = (ms: number) => vnDateString(new Date(ms));
const shortDay = (ms: number) => formatDayShort(dayOf(ms));

// Spec §6.3: "{HH:mm} hôm nay" for a time today, "{dd/mm} {HH:mm}" otherwise.
export function whenText(at: number, now: Date): string {
  const time = formatVnTime(new Date(at));
  return dayOf(at) === vnDateString(now)
    ? `${time} hôm nay`
    : `${shortDay(at)} ${time}`;
}

export type SummaryRow = {
  label: string;
  // The small time between the label and the value; null when there is none.
  when: string | null;
  value: string;
};

export type VerdictView = {
  verdict: Verdict;
  sub: string;
  rows: SummaryRow[];
  // An open episode has the three quick-log buttons.
  open: boolean;
};

// Spec §6.3 item 2: the verdict card.
export function verdictView(input: {
  episode: EpisodeLike;
  logs: LogLike[];
  babyName: string;
  now: Date;
}): VerdictView {
  const { episode, logs, babyName, now } = input;
  const status = feverStatus(logs, episode, now);
  const doses = antipyreticTimes(logs, episode, now);
  const start = Date.parse(episode.started_at);
  const { latest, peak } = status;
  return {
    verdict: episodeVerdict({ episode, status, babyName, now }),
    sub: episode.ended_at
      ? `${shortDay(start)} – ${shortDay(Date.parse(episode.ended_at))}`
      : `Ngày thứ ${episodeDayCount(episode, now)} · bắt đầu ${shortDay(start)} lúc ${formatVnTime(new Date(start))}`,
    rows: [
      latest
        ? {
            label: "Đo gần nhất",
            when: whenText(latest.at, now),
            value: `${formatCelsius(latest.celsius)}°C`,
          }
        : { label: "Đo gần nhất", when: null, value: "Chưa đo" },
      peak && hasFever(peak.celsius)
        ? {
            label: "Sốt cao nhất",
            when: whenText(peak.at, now),
            value: `${formatCelsius(peak.celsius)}°C`,
          }
        : {
            label: "Sốt cao nhất",
            when: null,
            // Nothing measured is not the same as no fever.
            value: peak ? "Không sốt" : "Chưa đo",
          },
      doses.length > 0
        ? {
            label: "Thuốc hạ sốt",
            when: `gần nhất ${whenText(doses[doses.length - 1], now)}`,
            value: `${doses.length} liều`,
          }
        : { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
    ],
    open: episode.ended_at === null,
  };
}

export type DayRowView = {
  day: string;
  title: string;
  detail: string;
  // Short names of the day's symptoms, in the content's order.
  chips: string[];
  label: DayLabel | null;
};

// Spec §6.3 item 4: one row per day, newest first.
export function dayRows(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): DayRowView[] {
  const today = vnDateString(now);
  return episodeDays(logs, episode, now).map((row) => ({
    day: row.day,
    title: `${row.day === today ? "Hôm nay" : formatDayShort(row.day)} · ngày ${row.n}`,
    detail: [
      row.peak === null ? "Chưa đo" : `Cao nhất ${formatCelsius(row.peak)}°C`,
      row.doses > 0 ? `${row.doses} liều hạ sốt` : "không dùng thuốc",
    ].join(" · "),
    chips: symptomShorts(row.codes, TRIAGE.symptoms),
    label: row.label,
  }));
}

const USUAL_LABEL: Record<UsualKey, string> = {
  feeds: "Bú",
  wetDiapers: "Tã ướt",
  sleepMinutes: "Ngủ",
};
const USUAL_CHIP: Record<UsualVerdict, { text: string; tone: EpisodeTone }> = {
  less: { text: "Ít hơn", tone: "warn" },
  usual: { text: "Như thường", tone: "good" },
  more: { text: "Nhiều hơn", tone: "neutral" },
};
// Spec §5.4: "{giá trị} cữ · thường {nền} cữ"; the usual value is rounded to
// a whole number, and sleep is counted in whole hours.
const usualLine = (key: UsualKey, value: number, base: number) =>
  key === "sleepMinutes"
    ? `${Math.round(value / 60)} giờ · thường ${Math.round(base / 60)} giờ`
    : `${value} ${key === "feeds" ? "cữ" : "lần"} · thường ${Math.round(base)} ${key === "feeds" ? "cữ" : "lần"}`;

export type UsualView = {
  // What is compared with what; null when there is nothing to compare.
  sub: string | null;
  // The one sentence instead of the rows.
  message: string | null;
  rows: {
    label: string;
    line: string;
    chip: { text: string; tone: EpisodeTone };
  }[];
};

// Spec §6.3 item 5: the card "So với thường ngày". No advice, ever.
export function usualView(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): UsualView {
  const result = usualComparison(logs, episode, now);
  if (result.kind !== "rows")
    return {
      sub: null,
      message:
        result.kind === "no-day"
          ? "Chưa có ngày trọn nào của đợt ốm để so."
          : "Chưa đủ dữ liệu trước khi ốm để so.",
      rows: [],
    };
  const day = episode.ended_at ? formatDayShort(result.day) : "Hôm qua";
  return {
    sub: `${day}, so với trung bình 7 ngày trước khi ốm`,
    message: null,
    rows: result.rows.map((row) => ({
      label: USUAL_LABEL[row.key],
      line: usualLine(row.key, row.value, row.base),
      chip: USUAL_CHIP[row.verdict],
    })),
  };
}

const CHIP_TEXT = {
  fever: "Đang sốt",
  stale: "Chưa đo lại",
  cleared: "Hết sốt",
  none: "Không sốt",
} as const;

export type EpisodeListView = {
  open: {
    id: string;
    href: string;
    title: string;
    chip: { text: string; tone: EpisodeTone } | null;
  } | null;
  past: { id: string; href: string; text: string }[];
};

// Spec §6.2: the list page. `openLogs` are the logs of the open episode
// (useRangeLogs); undefined until they have loaded, and then there is no chip.
export function episodeList(input: {
  episodes: EpisodeLike[];
  openLogs: LogLike[] | undefined;
  now: Date;
}): EpisodeListView {
  const { episodes, openLogs, now } = input;
  const year = vnDateString(now).slice(0, 4);
  // Spec §6.2: a date of another year is written with its year.
  const date = (iso: string) => {
    const day = dayOf(Date.parse(iso));
    return day.startsWith(year) ? formatDayShort(day) : formatDayFull(day);
  };
  const current = episodes.find((episode) => episode.ended_at === null);
  let open: EpisodeListView["open"] = null;
  if (current) {
    const status = openLogs ? feverStatus(openLogs, current, now) : null;
    open = {
      id: current.id,
      href: episodeHref(current.id),
      title: `Từ ${shortDay(Date.parse(current.started_at))} · ngày thứ ${episodeDayCount(current, now)}`,
      chip:
        status && status.kind !== "unmeasured"
          ? { text: CHIP_TEXT[status.kind], tone: statusTone(status) }
          : null,
    };
  }
  return {
    open,
    past: episodes
      .filter((episode) => episode.ended_at !== null)
      .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
      .map((episode) => ({
        id: episode.id,
        href: episodeHref(episode.id),
        text: `${date(episode.started_at)} – ${date(String(episode.ended_at))} · ${episodeDayCount(episode, now)} ngày`,
      })),
  };
}

// Spec §7.1 {giờ}: "{HH:mm}" for a time today, "{dd/mm} {HH:mm}" otherwise.
export function clockText(at: number, now: Date): string {
  const time = formatVnTime(new Date(at));
  return dayOf(at) === vnDateString(now) ? time : `${shortDay(at)} ${time}`;
}

export type HomeEpisodeView = {
  href: string;
  title: string;
  // The fever state and the newest reading; null until the logs have loaded.
  sub: string | null;
};

// Spec §7.1: the card of the open episode on the home page. `logs` are the
// logs of that episode (useRangeLogs); undefined until they have loaded.
export function homeEpisodeCard(input: {
  episode: EpisodeLike;
  logs: LogLike[] | undefined;
  now: Date;
}): HomeEpisodeView {
  const { episode, logs, now } = input;
  let sub: string | null = null;
  if (logs) {
    const { kind, latest, lastFever } = feverStatus(logs, episode, now);
    if (kind === "unmeasured" || !latest) sub = "Chưa đo nhiệt độ";
    else {
      const state =
        kind === "cleared" && lastFever
          ? `${CHIP_TEXT.cleared} ${sinceText(now.getTime() - lastFever.at)}`
          : CHIP_TEXT[kind];
      // The reading stays whole: its spaces do not break, so a narrow
      // card breaks the line after "·", never inside "25/11 23:59".
      const reading = `${formatCelsius(latest.celsius)}°C lúc ${clockText(latest.at, now)}`;
      sub = `${state} · ${reading.replaceAll(" ", "\u00a0")}`;
    }
  }
  return {
    href: episodeHref(episode.id),
    title: `Đang ốm · ngày ${episodeDayCount(episode, now)}`,
    sub,
  };
}

const CLOSE_TITLE: Record<CloseCase, (babyName: string) => string> = {
  "no-fever": (babyName) => `${babyName} đã 48 giờ không sốt`,
  unchecked: () => "48 giờ qua chưa đo lại nhiệt độ",
  quiet: () => "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
};

export type CloseReminderView = {
  title: string;
  sub: string;
  // The round icon: the one the verdict card shows for the episode's state.
  tone: EpisodeTone;
  icon: Verdict["icon"];
};

// Spec §7.3: the reminder to close the open episode. `kind` comes from
// closeReminder; `logs` are the logs of the episode.
export function closeReminderView(input: {
  kind: CloseCase;
  episode: EpisodeLike;
  logs: LogLike[];
  babyName: string;
  now: Date;
}): CloseReminderView {
  const { kind, episode, logs, babyName, now } = input;
  const status = feverStatus(logs, episode, now);
  const { tone, icon } = episodeVerdict({ episode, status, babyName, now });
  return {
    title: CLOSE_TITLE[kind](babyName),
    sub: `Đợt ốm bắt đầu ${shortDay(Date.parse(episode.started_at))} xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.`,
    tone,
    icon,
  };
}
