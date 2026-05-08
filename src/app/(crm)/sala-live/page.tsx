import { Armchair, CalendarDays, Users } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalaLiveBoard } from "@/components/sala-live-board";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { reservations, roomTables } from "@/lib/demo-data";

export default function SalaLivePage() {
  const occupiedTables = roomTables.filter((table) => table.status === "occupied");
  const reservedTables = roomTables.filter((table) => table.status === "reserved");
  const coversInRoom = reservations
    .filter((reservation) => reservation.status === "seated")
    .reduce((total, reservation) => total + reservation.partySize, 0);

  return (
    <>
      <PageHeader title="Sala live" description="Tavoli, prenotazioni e walk-in nello stesso flusso operativo." />

      <section className="mb-7 grid gap-5 md:grid-cols-3">
        <MetricCard icon={<Users className="size-6" />} label="In sala adesso" value={String(coversInRoom)} helper={`${occupiedTables.length} tavoli occupati`} />
        <MetricCard icon={<CalendarDays className="size-6" />} label="Tavoli prenotati" value={String(reservedTables.length)} helper="assegnati a prenotazioni" />
        <MetricCard icon={<Armchair className="size-6" />} label="Tavoli liberi" value={String(roomTables.length - occupiedTables.length - reservedTables.length)} helper="disponibili ora" />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-3xl">Mappa sala</CardTitle>
            <CardDescription>Passa col cursore su un tavolo per leggere nome cliente, telefono e orario.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-[999px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Libero</span>
            <span className="rounded-[999px] border border-slate-300 bg-slate-100 px-3 py-1 text-slate-700">Prenotato</span>
            <span className="rounded-[999px] border border-ink bg-ink px-3 py-1 text-white">In sala</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto thin-scrollbar">
            <SalaLiveBoard />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
