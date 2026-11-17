import {
  detailsSchemas,
  LOG_TYPES,
  type LogDetails,
  type LogType,
} from "./logDetails";
import { formatDuration } from "./time";

export type LogLike = {
  type: string;
  started_at: string;
  ended_at: string | null;
  details: unknown;
};

const MILK = { breast_milk: "sữa mẹ", formula: "sữa công thức" } as const;
const STOOL = {
  yellow: "vàng",
  green: "xanh",
  brown: "nâu",
  black: "đen",
  pale: "bạc màu",
  red: "có máu",
} as const;
const METHOD = {
  nach: "nách",
  tran: "trán",
  tai: "tai",
  hau_mon: "hậu môn",
} as const;
const AMOUNT = { little: "ít", some: "vừa", lots: "nhiều" } as const;
const TIMER_LABEL = {
  sleep: "Ngủ",
  pump: "Hút sữa",
  tummy: "Tummy time",
} as const;

function duration(log: LogLike, now: Date): string {
  const end = log.ended_at ? Date.parse(log.ended_at) : now.getTime();
  const text = formatDuration(end - Date.parse(log.started_at));
  return log.ended_at ? text : `${text} (đang chạy)`;
}

function isLogType(type: string): type is LogType {
  return (LOG_TYPES as readonly string[]).includes(type);
}

export function describeLog(log: LogLike, now: Date): string {
  if (!isLogType(log.type)) return "Bản ghi không hợp lệ";
  const parsed = detailsSchemas[log.type].safeParse(log.details);
  if (!parsed.success) return "Bản ghi không hợp lệ";

  switch (log.type) {
    case "breast": {
      const d = parsed.data as LogDetails["breast"];
      return `Bú ${d.side === "left" ? "trái" : "phải"} · ${duration(log, now)}`;
    }
    case "sleep":
    case "tummy":
      return `${TIMER_LABEL[log.type]} · ${duration(log, now)}`;
    case "pump": {
      const d = parsed.data as LogDetails["pump"];
      const ml = (d.mlLeft ?? 0) + (d.mlRight ?? 0);
      return `${TIMER_LABEL.pump} · ${duration(log, now)}${ml > 0 ? ` · ${ml} ml` : ""}`;
    }
    case "bottle": {
      const d = parsed.data as LogDetails["bottle"];
      return `Bình ${d.ml} ml ${MILK[d.milk]}`;
    }
    case "diaper": {
      const d = parsed.data as LogDetails["diaper"];
      const kinds = [d.wet && "ướt", d.dirty && "bẩn"]
        .filter(Boolean)
        .join(" + ");
      return `Tã ${kinds}${d.stoolColor ? ` (phân ${STOOL[d.stoolColor]})` : ""}`;
    }
    case "medicine": {
      const d = parsed.data as LogDetails["medicine"];
      return `Thuốc ${d.name} ${d.amount} ${d.unit}${d.antipyretic ? " · hạ sốt" : ""}`;
    }
    case "temperature": {
      const d = parsed.data as LogDetails["temperature"];
      return `Nhiệt độ ${d.celsius.toFixed(1)}°C (${METHOD[d.method]})`;
    }
    case "solids": {
      const d = parsed.data as LogDetails["solids"];
      return `Ăn dặm · ${d.food} · ${AMOUNT[d.amount]}${d.isNew ? " · món mới" : ""}${d.reaction ? ` · ${d.reaction}` : ""}`;
    }
    case "water": {
      const d = parsed.data as LogDetails["water"];
      return `Uống nước · ${d.ml} ml`;
    }
    case "bath":
      return "Tắm";
    case "note": {
      const d = parsed.data as LogDetails["note"];
      return `Ghi chú · ${d.text}`;
    }
  }
}
