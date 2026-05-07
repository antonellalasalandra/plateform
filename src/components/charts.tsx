"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MetricPoint } from "@/lib/types";

const palette = ["#0f172a", "#64748b", "#14b8a6", "#8b5cf6"];

export function TrendChart({ data, currency = false }: { data: MetricPoint[]; currency?: boolean }) {
  return (
    <div className="h-[310px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 8, right: 18, top: 18, bottom: 0 }}>
          <defs>
            <linearGradient id="plateformTrend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7edf5" strokeDasharray="4 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#0f172a" }} tick={{ fill: "#5d6677", fontWeight: 600 }} />
          <YAxis tickLine={false} axisLine={{ stroke: "#6b7280" }} tick={{ fill: "#5d6677", fontWeight: 600 }} />
          <Tooltip
            formatter={(value) => (currency ? `€ ${Number(value).toFixed(2)}` : Number(value).toLocaleString("it-IT"))}
            contentStyle={{ borderRadius: 6, border: "1px solid #dbe3ed", fontWeight: 700 }}
          />
          <Area type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} fill="url(#plateformTrend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarMetricChart({ data }: { data: MetricPoint[] }) {
  return (
    <div className="h-[310px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 18, top: 18, bottom: 0 }}>
          <CartesianGrid stroke="#e7edf5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#0f172a" }} tick={{ fill: "#5d6677", fontWeight: 600 }} />
          <YAxis tickLine={false} axisLine={{ stroke: "#6b7280" }} tick={{ fill: "#5d6677", fontWeight: 600 }} />
          <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #dbe3ed", fontWeight: 700 }} />
          <Bar dataKey="value" fill="#0f172a" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ data }: { data: MetricPoint[] }) {
  return (
    <div className="flex h-[310px] items-center gap-8">
      <div className="h-full flex-1">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={74} outerRadius={112} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #dbe3ed", fontWeight: 700 }} />
          </PieChart>
        </ResponsiveContainer>
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
