import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  icon,
  label,
  value,
  helper
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="flex min-h-[112px] items-center gap-5 p-6">
      <div className="grid size-14 shrink-0 place-items-center rounded-[6px] bg-slate-100 text-ink">{icon}</div>
      <div>
        <p className="text-sm font-bold text-muted">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-normal text-ink">{value}</p>
        {helper ? <p className="mt-1 text-xs font-bold text-muted">{helper}</p> : null}
      </div>
    </Card>
  );
}
