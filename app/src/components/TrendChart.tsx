import { ensReadiness, temperatureTrusted, type TelemetrySample } from "../domain/protocol";
import type { ObservedSample } from "../domain/engine";

export type ChartMetric = "temperature" | "humidity" | "tvoc";

interface Props {
  samples: ObservedSample[];
  metric?: ChartMetric;
  thresholdC?: number;
  compact?: boolean;
}

function valueFor(sample: TelemetrySample, metric: ChartMetric): number | null {
  if (metric === "temperature") return temperatureTrusted(sample) ? sample.temperature : null;
  if (metric === "humidity") return temperatureTrusted(sample) ? sample.humidity : null;
  return ensReadiness(sample) === "ready" ? sample.tvoc : null;
}

function rangeFor(metric: ChartMetric): [number, number] {
  if (metric === "temperature") return [2, 12];
  if (metric === "humidity") return [30, 100];
  return [0, 1500];
}

export function TrendChart({ samples, metric = "temperature", thresholdC = 8, compact = false }: Props) {
  const width = 320;
  const height = compact ? 72 : 108;
  const padX = 4;
  const padY = 7;
  const [min, max] = rangeFor(metric);
  const plotHeight = height - padY * 2;
  const yAt = (value: number) => padY + (max - Math.max(min, Math.min(max, value))) / (max - min) * plotHeight;
  const usable = samples.slice(-60);
  const segments: string[] = [];
  let segment: string[] = [];
  usable.forEach((sample, index) => {
    const value = valueFor(sample, metric);
    if (value === null) {
      if (segment.length) segments.push(segment.join(" "));
      segment = [];
      return;
    }
    const x = padX + (width - padX * 2) * (usable.length <= 1 ? 1 : index / (usable.length - 1));
    segment.push(`${x.toFixed(1)},${yAt(value).toFixed(1)}`);
  });
  if (segment.length) segments.push(segment.join(" "));
  const thresholdY = metric === "temperature" ? yAt(thresholdC) : null;
  const metricName = metric === "temperature" ? "Temperature" : metric === "humidity" ? "Relative humidity" : "ENS160 TVOC";
  const unit = metric === "temperature" ? "°C" : metric === "humidity" ? "%" : "ppb";
  const values = usable.map((sample) => valueFor(sample, metric)).filter((value): value is number => value !== null);
  const first = values[0];
  const latest = values[values.length - 1];
  const high = values.length ? Math.max(...values) : null;
  const direction = first === undefined || latest === undefined || values.length < 2
    ? "trend not established"
    : latest > first ? "increasing" : latest < first ? "decreasing" : "steady";
  const chartDescription = values.length
    ? `${metricName} trend. ${values.length} valid readings, ${direction}, from ${first.toFixed(1)} to ${latest.toFixed(1)} ${unit}; recent high ${high!.toFixed(1)} ${unit}.${thresholdY !== null ? ` The ${thresholdC.toFixed(1)} °C alert threshold is dashed.` : ""}`
    : `${metricName} trend. No valid readings yet.`;

  return (
    <div className={`trend-chart ${compact ? "trend-chart-compact" : ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={chartDescription}>
        {[0.18, 0.5, 0.82].map((ratio) => <line key={ratio} className="chart-gridline" x1="0" x2={width} y1={height * ratio} y2={height * ratio} />)}
        {thresholdY !== null && <line className="chart-threshold" x1="0" x2={width} y1={thresholdY} y2={thresholdY} />}
        {segments.map((points, index) => <polyline key={index} className="chart-series" points={points} />)}
        {usable.length > 0 && (() => {
          const last = usable[usable.length - 1];
          const lastValue = valueFor(last, metric);
          return lastValue === null ? null : <circle className="chart-current" cx={width - padX} cy={yAt(lastValue)} r="3.5" />;
        })()}
      </svg>
      {!compact && <div className="chart-caption"><span>{values.length ? "Earlier" : "No valid readings"}</span><span>{thresholdY !== null ? `${thresholdC.toFixed(1)} °C · dashed threshold` : "Latest at right"}</span><span>Now</span></div>}
    </div>
  );
}
