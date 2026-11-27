import { Glass } from "@/components/ui/Glass";
import type { FeverChart as FeverChartModel } from "@/lib/rules/illness";

// The drawing, in viewBox units (about one CSS px at 375 px wide).
const WIDTH = 330;
const HEIGHT = 204;
const LEFT = 34;
const RIGHT = 322;
// Room above the plot for the label of a reading at the top of the scale.
const TOP = 26;
const BOTTOM = 154;
// The row of dose marks under the plot, and the day names under that.
const DOSE_Y = 170;
const DAY_Y = 198;

const MUTED = "var(--color-muted)";
const INK = "var(--color-ink)";
const TEMP = "var(--color-cat-temp)";

const px = (x: number) => LEFT + x * (RIGHT - LEFT);
const py = (y: number) => BOTTOM - y * (BOTTOM - TOP);
const round = (value: number) => Math.round(value * 10) / 10;

// Spec 2026-11-26 §6.5: the fever chart. Everything it draws comes from
// feverChartModel; this component only turns fractions into coordinates.
// A reading is a round dot and a dose a diamond, so the two differ by shape
// as well as colour (theme night has one hue).
export function FeverChart({ chart }: { chart: FeverChartModel }) {
  const feverY = round(py(chart.feverY));
  return (
    <svg
      role="img"
      aria-label={chart.ariaLabel}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
    >
      <rect
        x={LEFT}
        y={TOP}
        width={RIGHT - LEFT}
        height={feverY - TOP}
        fill="var(--color-danger)"
        fillOpacity={0.07}
      />
      {chart.ticks
        .filter((tick) => tick.celsius !== 38)
        .map((tick) => (
          <line
            key={tick.celsius}
            x1={LEFT}
            x2={RIGHT}
            y1={round(py(tick.y))}
            y2={round(py(tick.y))}
            stroke={INK}
            strokeOpacity={0.08}
          />
        ))}
      <line
        x1={LEFT}
        x2={RIGHT}
        y1={feverY}
        y2={feverY}
        stroke="var(--color-danger)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {chart.dividers.map((x) => (
        <line
          key={x}
          data-day-border
          x1={round(px(x))}
          x2={round(px(x))}
          y1={TOP}
          y2={DOSE_Y + 10}
          stroke={INK}
          strokeOpacity={0.14}
        />
      ))}
      <text x={6} y={11} fontSize={11} fill={MUTED}>
        °C
      </text>
      {chart.ticks.map((tick) => (
        <text
          key={tick.celsius}
          x={LEFT - 6}
          y={round(py(tick.y)) + 4}
          textAnchor="end"
          fontSize={11}
          fontWeight={tick.celsius === 38 ? 600 : 400}
          fill={tick.celsius === 38 ? "var(--color-danger-ink)" : MUTED}
        >
          {tick.celsius}
        </text>
      ))}
      <text
        x={
          chart.feverWord === "end"
            ? RIGHT - 4
            : chart.feverWord === "start"
              ? LEFT + 4
              : (LEFT + RIGHT) / 2
        }
        y={TOP + 12}
        textAnchor={chart.feverWord}
        fontSize={11}
        fontWeight={600}
        fill="var(--color-danger-ink)"
      >
        Sốt
      </text>
      {chart.days.map((day) => (
        <text
          key={day.day}
          x={round(px(day.x))}
          y={DAY_Y}
          textAnchor="middle"
          fontSize={11}
          fill={MUTED}
        >
          {day.label}
        </text>
      ))}
      {chart.points.length > 1 && (
        <polyline
          points={chart.points
            .map((point) => `${round(px(point.x))},${round(py(point.y))}`)
            .join(" ")}
          fill="none"
          stroke={TEMP}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Keys are positions: two logs may carry the same minute. */}
      {chart.points.map((point, index) => (
        <circle
          key={index}
          cx={round(px(point.x))}
          cy={round(py(point.y))}
          r={point.latest ? 6.5 : 4}
          fill={TEMP}
          stroke={point.latest ? "var(--color-glass-solid)" : "none"}
          strokeWidth={point.latest ? 2.5 : 0}
        />
      ))}
      {chart.doses.map((dose, index) => (
        <path
          key={index}
          data-dose
          d={`M${round(px(dose.x))} ${DOSE_Y - 6}l6 6-6 6-6-6z`}
          fill="var(--color-cat-med)"
        />
      ))}
      {chart.points.map(
        (point, index) =>
          point.label && (
            <text
              key={index}
              data-point-label
              x={
                round(px(point.x)) +
                (point.label.place !== "side"
                  ? 0
                  : point.label.anchor === "end"
                    ? -11
                    : 11)
              }
              y={
                round(py(point.y)) +
                (point.label.place === "side"
                  ? 4.5
                  : point.label.place === "below"
                    ? 21
                    : point.latest
                      ? -12
                      : -9)
              }
              textAnchor={point.label.anchor}
              fontSize={point.latest ? 13 : 12}
              fontWeight={700}
              fill={INK}
              // A halo in the card's colour keeps the number readable where
              // the line runs behind it.
              stroke="var(--color-glass-solid)"
              strokeWidth={3}
              strokeLinejoin="round"
              style={{ paintOrder: "stroke" }}
            >
              {point.label.text}
            </text>
          ),
      )}
    </svg>
  );
}

const LEGEND = "flex items-center gap-1.5";

// The chart with the note of spec §6.5 and what the marks mean, without a
// card: the episode's page puts it in one, the doctor report prints it bare.
export function FeverChartFigure({ chart }: { chart: FeverChartModel }) {
  return (
    <>
      <FeverChart chart={chart} />
      {chart.truncated && (
        <p className="px-1 text-xs text-muted">7 ngày gần nhất</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
        <span className={LEGEND}>
          <span className="size-2.5 rounded-full bg-cat-temp" />
          Nhiệt độ
        </span>
        <span className={LEGEND}>
          <span className="size-[9px] rotate-45 bg-cat-med" />
          Liều hạ sốt
        </span>
        <span className={LEGEND}>
          <span className="w-3.5 border-t-2 border-dashed border-danger" />
          Từ 38°C là sốt
        </span>
      </div>
    </>
  );
}

// The card around the chart: its title, the chart, or the one sentence of
// spec §6.5 when the episode has no reading.
export function FeverChartCard({ chart }: { chart: FeverChartModel | null }) {
  return (
    <Glass className="flex flex-col gap-2.5 p-3">
      <h2 className="px-1 text-[15px] font-semibold text-ink">
        Nhiệt độ và thuốc hạ sốt
      </h2>
      {chart ? (
        <FeverChartFigure chart={chart} />
      ) : (
        <p className="px-1 text-[15px] text-muted">
          Chưa có lần đo nào trong đợt này.
        </p>
      )}
    </Glass>
  );
}
