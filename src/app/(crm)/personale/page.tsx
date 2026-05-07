import { CalendarDays, ChevronLeft, Download, Link2, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Segment, Segmented } from "@/components/ui/tabs";
import { shiftTemplates } from "@/lib/demo-data";

const days = [
  ["LUN", "4"],
  ["MAR", "5"],
  ["MER", "6"],
  ["GIO", "7"],
  ["VEN", "8"],
  ["SAB", "9"],
  ["DOM", "10"]
];

const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

export default function PersonalePage() {
  return (
    <>
      <PageHeader title="Personale" description="Gestisci dipendenti e turni di lavoro." />

      <div className="mb-6">
        <Segmented>
          <Segment active>Turni</Segment>
          <Segment>Dipendenti</Segment>
        </Segmented>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">Pianificazione turni</h2>
              <p className="mt-1 text-base font-semibold text-muted">Settimana del 04/05/2026 - 10/05/2026 · 0.0 ore · costo stimato € 0.00</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented>
                <Segment>Giorno</Segment>
                <Segment active>Settimana</Segment>
                <Segment>Mese</Segment>
              </Segmented>
              <Button variant="outline">
                <Link2 className="size-5" />
                Collega Google Calendar
              </Button>
              <Button variant="outline" className="w-12 px-0">
                <ChevronLeft className="size-5" />
              </Button>
              <Button variant="outline">Oggi</Button>
              <Button variant="outline">
                <Download className="size-5" />
                PDF
              </Button>
              <Button>
                <Plus className="size-5" />
                Nuovo turno
              </Button>
            </div>
          </div>

          <div className="mb-4 rounded-[6px] border border-dashed border-line bg-slate-50 px-4 py-4 text-center text-sm font-bold text-muted">
            Nessun dipendente attivo. Aggiungine uno nella tab "Dipendenti" per poter assegnare turni.
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[6px] border border-line bg-white px-3 py-3">
            <span className="mr-2 text-sm font-bold text-muted">Trascina su un giorno:</span>
            {shiftTemplates.map((template) => (
              <button key={template.label} className="rounded-[6px] border border-line bg-white px-3 py-2 text-sm font-bold shadow-sm">
                {template.label} <span className="font-semibold text-muted">{template.time}</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto thin-scrollbar">
            <div className="min-w-[980px] rounded-[8px] border border-line bg-white">
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-line">
                <div />
                {days.map(([weekday, day]) => (
                  <div key={weekday} className="border-l border-line px-4 py-4 text-center">
                    <p className="text-xs font-extrabold text-muted">{weekday}</p>
                    <p className={day === "8" ? "mx-auto mt-1 grid size-10 place-items-center rounded-full bg-ink text-lg font-extrabold text-white" : "mt-1 text-lg font-extrabold"}>
                      {day}
                    </p>
                  </div>
                ))}
              </div>
              {hours.map((hour) => (
                <div key={hour} className="grid h-16 grid-cols-[70px_repeat(7,1fr)] border-b border-line last:border-b-0">
                  <div className="px-3 py-2 text-xs font-bold text-muted">{hour}</div>
                  {days.map(([weekday, day]) => (
                    <div key={`${weekday}-${hour}`} className={day === "8" ? "border-l border-line bg-slate-100/70" : "border-l border-line bg-white"} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
