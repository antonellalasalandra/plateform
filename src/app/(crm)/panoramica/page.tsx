import { ArrowRight, CalendarDays, TrendingUp, UserPlus, Users } from "lucide-react";
import { BarMetricChart, TrendChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { RoomBoard } from "@/components/room-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segment, Segmented } from "@/components/ui/tabs";
import { coverAverageByDay, reservationTrend, reservations, restaurant } from "@/lib/demo-data";

export default function PanoramicaPage() {
  const seated = reservations.filter((reservation) => reservation.status === "seated");
  const coversInRoom = seated.reduce((total, reservation) => total + reservation.partySize, 0);
  const occupancy = Math.round((coversInRoom / restaurant.capacity) * 100);

  return (
    <>
      <PageHeader
        title="Panoramica"
        description="Andamento delle prenotazioni e statistiche del locale."
        actions={
          <Segmented>
            <Segment>Oggi</Segment>
            <Segment>7 giorni</Segment>
            <Segment active>30 giorni</Segment>
            <Segment>90 giorni</Segment>
          </Segmented>
        }
      />

      <section className="mb-7 rounded-[8px] border border-slate-300 bg-white p-6 shadow-plate">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid size-16 place-items-center rounded-[8px] bg-ink text-white">
              <Users className="size-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted">In sala adesso</p>
              <p className="mt-1 text-4xl font-extrabold tracking-normal">
                {coversInRoom} <span className="text-lg font-bold text-muted">/ {restaurant.capacity} coperti</span>
              </p>
              <p className="text-sm font-bold text-muted">{seated.length} tavoli occupati</p>
            </div>
          </div>
          <div className="min-w-[280px]">
            <div className="mb-3 flex justify-end gap-2">
              <Button>
                <UserPlus className="size-5" />
                Walk-in
              </Button>
              <Button variant="outline">
                Vedi
                <ArrowRight className="size-5" />
              </Button>
            </div>
            <div className="h-4 rounded-full bg-slate-100">
              <div className="h-4 rounded-full bg-ink" style={{ width: `${occupancy}%` }} />
            </div>
            <p className="mt-1 text-right text-sm font-bold text-muted">{occupancy}% capacità</p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<CalendarDays className="size-6" />} label="Prenotazioni oggi" value="21" />
        <MetricCard icon={<Users className="size-6" />} label="Coperti oggi" value="68" />
        <MetricCard icon={<TrendingUp className="size-6" />} label="Prenotazioni settimana" value="112" />
        <MetricCard icon={<span className="text-2xl font-black">%</span>} label="Occupazione periodo" value="74%" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prenotazioni nel tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={reservationTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coperti medi per giorno</CardTitle>
          </CardHeader>
          <CardContent>
            <BarMetricChart data={coverAverageByDay} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <RoomBoard />
        <Card>
          <CardHeader>
            <CardTitle>Prossime prenotazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between rounded-[6px] border border-line px-4 py-3">
                  <div>
                    <p className="font-extrabold">{reservation.customerName}</p>
                    <p className="text-sm font-semibold text-muted">
                      {reservation.startTime} · {reservation.partySize} coperti · {reservation.tableNames.join(", ")}
                    </p>
                  </div>
                  <span className="rounded-[999px] bg-slate-100 px-3 py-1 text-xs font-bold text-muted">{reservation.source}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
