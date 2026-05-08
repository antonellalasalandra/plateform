import type { MetricPoint } from "@/lib/types";

const palette = ["#0f172a", "#64748b", "#14b8a6", "#8b5cf6"];

export function TrendChart({ data, currency = false }: { data: MetricPoint[]; currency?: boolean }) {
  const chart = getChartGeometry(data, { width: 680, height: 310, top: 18, right: 24, bottom: 46, left: 52 });
  const linePath = chart.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${chart.points.at(-1)?.x ?? chart.innerLeft} ${chart.innerBottom} L ${chart.innerLeft} ${chart.innerBottom} Z`;

  return (
    <div className="h-[310px] w-full">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={currency ? "plateformRevenueTrend" : "plateformReservationTrend"} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="95%" stopColor="#0f172a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <ChartGrid chart={chart} />
        <path d={areaPath} fill={`url(#${currency ? "plateformRevenueTrend" : "plateformReservationTrend"})`} />
        <path d={linePath} fill="none" stroke="#0f172a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        {chart.points.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="3.5" fill="#0f172a" />
        ))}
        <AxisLabels chart={chart} formatValue={(value) => (currency ? `€ ${compactNumber(value)}` : compactNumber(value))} />
      </svg>
    </div>
  );
}

export function BarMetricChart({ data }: { data: MetricPoint[] }) {
  const chart = getChartGeometry(data, { width: 680, height: 310, top: 18, right: 24, bottom: 46, left: 52 });
  const barGap = 14;
  const barWidth = Math.max(18, (chart.innerWidth - barGap * (data.length - 1)) / data.length);

  return (
    <div className="h-[310px] w-full">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <ChartGrid chart={chart} />
        {chart.points.map((point, index) => {
          const x = chart.innerLeft + index * (barWidth + barGap);
          const height = chart.innerBottom - point.y;

          return <rect key={point.label} x={x} y={point.y} width={barWidth} height={height} rx="5" fill="#0f172a" />;
        })}
        <AxisLabels chart={chart} formatValue={compactNumber} />
      </svg>
    </div>
  );
}

export function DonutChart({ data }: { data: MetricPoint[] }) {
  const total = Math.max(
    1,
    data.reduce((sum, item) => sum + item.value, 0)
  );
  let offset = -90;

  return (
    <div className="flex h-[310px] items-center gap-8">
      <div className="h-full flex-1">
        <svg viewBox="0 0 320 320" role="img" className="h-full w-full">
          <circle cx="160" cy="160" r="104" fill="none" stroke="#e7edf5" strokeWidth="34" />
          {data.map((item, index) => {
            const degrees = (item.value / total) * 360;
            const path = describeArc(160, 160, 104, offset, offset + degrees);
            offset += degrees;

            return (
              <path
                key={item.label}
                d={path}
                fill="none"
                stroke={palette[index % palette.length]}
                strokeLinecap="round"
                strokeWidth="34"
              />
            );
          })}
          <text x="160" y="154" textAnchor="middle" className="fill-ink text-[32px] font-extrabold">
            {total}%
          </text>
          <text x="160" y="184" textAnchor="middle" className="fill-slate-500 text-[14px] font-bold">
            pagamenti
          </text>
        </svg>
      </div>
      <div className="w-44 space-y-3">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm font-bold">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2 rounded-full" style={{ background: palette[index % palette.length] }} />
              {item.label}
            </span>
            <span>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ChartBox = ReturnType<typeof getChartGeometry>;

function getChartGeometry(
  data: MetricPoint[],
  size: { width: number; height: number; top: number; right: number; bottom: number; left: number }
) {
  const values = data.map((item) => item.value);
  const min = Math.min(0, ...values);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const innerLeft = size.left;
  const innerRight = size.width - size.right;
  const innerTop = size.top;
  const innerBottom = size.height - size.bottom;
  const innerWidth = innerRight - innerLeft;
  const innerHeight = innerBottom - innerTop;

  const points = data.map((item, index) => {
    const x = data.length === 1 ? innerLeft + innerWidth / 2 : innerLeft + (index / (data.length - 1)) * innerWidth;
    const y = innerBottom - ((item.value - min) / span) * innerHeight;
    return { ...item, x, y };
  });

  return {
    ...size,
    min,
    max,
    innerLeft,
    innerRight,
    innerTop,
    innerBottom,
    innerWidth,
    innerHeight,
    points
  };
}

function ChartGrid({ chart }: { chart: ChartBox }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => {
        const y = chart.innerTop + (index / 4) * chart.innerHeight;
        return <line key={`y-${index}`} x1={chart.innerLeft} x2={chart.innerRight} y1={y} y2={y} stroke="#e7edf5" strokeDasharray="4 6" />;
      })}
      {Array.from({ length: 10 }, (_, index) => {
        const x = chart.innerLeft + (index / 9) * chart.innerWidth;
        return <line key={`x-${index}`} x1={x} x2={x} y1={chart.innerTop} y2={chart.innerBottom} stroke="#eef3f8" strokeDasharray="4 6" />;
      })}
      <line x1={chart.innerLeft} x2={chart.innerRight} y1={chart.innerBottom} y2={chart.innerBottom} stroke="#0f172a" strokeWidth="1.5" />
      <line x1={chart.innerLeft} x2={chart.innerLeft} y1={chart.innerTop} y2={chart.innerBottom} stroke="#64748b" strokeWidth="1.5" />
    </>
  );
}

function AxisLabels({ chart, formatValue }: { chart: ChartBox; formatValue: (value: number) => string }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => {
        const value = chart.max - (index / 4) * (chart.max - chart.min);
        const y = chart.innerTop + (index / 4) * chart.innerHeight;

        return (
          <text key={`yv-${index}`} x={chart.innerLeft - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[13px] font-bold">
            {formatValue(Math.round(value))}
          </text>
        );
      })}
      {chart.points.map((point) => (
        <text key={`xv-${point.label}`} x={point.x} y={chart.height - 16} textAnchor="middle" className="fill-slate-600 text-[13px] font-bold">
          {point.label}
        </text>
      ))}
    </>
  );
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("it-IT", { notation: value >= 1000 ? "compact" : "standard" }).format(value);
}
