import { useId, useState } from "react";

export interface DayDistance {
  label: string;
  km: number;
}

interface WeeklyChartProps {
  data: DayDistance[];
}

const WIDTH = 320;
const HEIGHT = 140;
const BAR_GAP = 8;
const AXIS_LABEL_HEIGHT = 20;

/**
 * Single-series magnitude chart: distance per day, this week. Uniform
 * Stamina Green fill (identity is the whole series — no legend needed),
 * bar height encodes the magnitude. Includes a hover tooltip and a visually
 * hidden data table so the values are available without relying on color.
 */
export function WeeklyChart({ data }: WeeklyChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const tableId = useId();

  const max = Math.max(...data.map((d) => d.km), 1);
  const plotHeight = HEIGHT - AXIS_LABEL_HEIGHT;
  const barWidth = (WIDTH - BAR_GAP * (data.length - 1)) / data.length;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-labelledby={tableId}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line x1={0} y1={plotHeight} x2={WIDTH} y2={plotHeight} stroke="var(--color-border)" strokeWidth={1} />

        {data.map((d, i) => {
          const x = i * (barWidth + BAR_GAP);
          const barHeight = Math.max((d.km / max) * (plotHeight - 8), d.km > 0 ? 4 : 0);
          const y = plotHeight - barHeight;
          const isHovered = hoverIndex === i;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="var(--color-primary)"
                opacity={hoverIndex === null || isHovered ? 1 : 0.45}
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.km.toFixed(1)} kilometers`}
              />
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--color-text-secondary)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: `${(hoverIndex / data.length) * 100}%`,
            background: "var(--color-text)",
            color: "var(--color-white)",
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: 8,
            pointerEvents: "none",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          {data[hoverIndex].label}: {data[hoverIndex].km.toFixed(1)} km
        </div>
      )}

      <table id={tableId} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        <caption>Distance per day, this week</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Distance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.km.toFixed(1)} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
