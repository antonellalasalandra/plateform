import { Armchair, CircleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roomTables } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const statusClass = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reserved: "border-slate-300 bg-slate-100 text-slate-700",
  occupied: "border-ink bg-ink text-white"
};

export function RoomBoard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Sala live</CardTitle>
          <CardDescription>Tavoli, prenotazioni e walk-in nello stesso flusso operativo.</CardDescription>
        </div>
        <div className="flex items-center gap-2 rounded-[6px] border border-line bg-white px-3 py-2 text-xs font-bold text-muted">
          <CircleAlert className="size-4" />
          Realtime ready
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[280px] overflow-hidden rounded-[8px] border border-line bg-slate-50">
          <div className="absolute inset-0 bg-[linear-gradient(#e6edf5_1px,transparent_1px),linear-gradient(90deg,#e6edf5_1px,transparent_1px)] bg-[size:56px_56px]" />
          {roomTables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "absolute flex size-[68px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[8px] border text-sm font-extrabold shadow-sm",
                statusClass[table.status as keyof typeof statusClass]
              )}
              style={{ left: `${table.x}%`, top: `${table.y}%` }}
            >
              <Armchair className="size-4" />
              {table.name}
              <span className="text-[11px] font-bold opacity-75">{table.seats} cop.</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
