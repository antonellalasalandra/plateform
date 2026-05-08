"use client";

import { ChevronLeft, Download, Link2, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Notice } from "@/components/notice";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { shiftTemplates } from "@/lib/demo-data";

const baseDays = [
  ["LUN", "4"],
  ["MAR", "5"],
  ["MER", "6"],
  ["GIO", "7"],
  ["VEN", "8"],
  ["SAB", "9"],
  ["DOM", "10"]
];

const hours = Array.from({ length: 17 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);

type Shift = {
  id: string;
  employee: string;
  day: string;
  label: string;
  time: string;
};

export function PersonaleWorkspace() {
  const [tab, setTab] = useState<"turni" | "dipendenti">("turni");
  const [view, setView] = useState<"giorno" | "settimana" | "mese">("settimana");
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const [shiftModal, setShiftModal] = useState<Shift | null>(null);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [employees, setEmployees] = useState(["Sara Bianchi", "Luca Verdi"]);
  const [shifts, setShifts] = useState<Shift[]>([
    { id: "shift-1", employee: "Sara Bianchi", day: "VEN", label: "Cena", time: "18:00-23:00" }
  ]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "Settimana del 04/05/2026 - 10/05/2026";
    if (weekOffset < 0) return "Settimana precedente";
    return "Settimana successiva";
  }, [weekOffset]);

  const totalHours = shifts.length * 5;

  function createShiftFromTemplate(label: string, time: string) {
    setShifts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        employee: employees[0] ?? "Staff",
        day: "VEN",
        label,
        time
      }
    ]);
    setNotice(`Turno ${label} aggiunto a venerdì.`);
  }

  function submitShift(formData: FormData) {
    setShifts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        employee: String(formData.get("employee") || "Staff"),
        day: String(formData.get("day") || "VEN"),
        label: String(formData.get("label") || "Turno"),
        time: `${formData.get("start") || "18:00"}-${formData.get("end") || "23:00"}`
      }
    ]);
    setShiftModal(null);
    setNotice("Nuovo turno creato.");
  }

  function addEmployee(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    setEmployees((current) => [...current, name]);
    setEmployeeModal(false);
    setNotice(`${name} aggiunto ai dipendenti.`);
  }

  function printPdf() {
    setNotice("Si apre la finestra di stampa: scegli 'Salva come PDF'.");
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <div className="mb-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { label: "Turni", value: "turni" },
            { label: "Dipendenti", value: "dipendenti" }
          ]}
        />
      </div>

      {tab === "dipendenti" ? (
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">Dipendenti</h2>
                <p className="text-sm font-semibold text-muted">Persone abilitate alla pianificazione turni.</p>
              </div>
              <Button onClick={() => setEmployeeModal(true)}>
                <Plus className="size-5" />
                Dipendente
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {employees.map((employee) => (
                <div key={employee} className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
                  <p className="font-extrabold">{employee}</p>
                  <p className="text-sm font-semibold text-muted">Attivo · {shifts.filter((shift) => shift.employee === employee).length} turni</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold">Pianificazione turni</h2>
                <p className="mt-1 text-base font-semibold text-muted">
                  {weekLabel} · {totalHours.toFixed(1)} ore · costo stimato € {(totalHours * 14).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  value={view}
                  onChange={setView}
                  options={[
                    { label: "Giorno", value: "giorno" },
                    { label: "Settimana", value: "settimana" },
                    { label: "Mese", value: "mese" }
                  ]}
                />
                <Button
                  variant={calendarConnected ? "secondary" : "outline"}
                  onClick={() => {
                    setCalendarConnected(true);
                    setNotice("Google Calendar collegato in modalità demo.");
                  }}
                >
                  <Link2 className="size-5" />
                  {calendarConnected ? "Calendar collegato" : "Collega Google Calendar"}
                </Button>
                <Button variant="outline" className="w-12 px-0" onClick={() => setWeekOffset((value) => value - 1)}>
                  <ChevronLeft className="size-5" />
                </Button>
                <Button variant="outline" onClick={() => setWeekOffset(0)}>
                  Oggi
                </Button>
                <Button variant="outline" onClick={printPdf}>
                  <Download className="size-5" />
                  PDF
                </Button>
                <Button onClick={() => setShiftModal({ id: "", employee: employees[0] ?? "", day: "VEN", label: "Cena", time: "18:00-23:00" })}>
                  <Plus className="size-5" />
                  Nuovo turno
                </Button>
              </div>
            </div>

            <div className="mb-4 rounded-[6px] border border-dashed border-line bg-slate-50 px-4 py-4 text-center text-sm font-bold text-muted">
              Vista attiva: {view}. Usa i template o "Nuovo turno" per assegnare turni.
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[6px] border border-line bg-white px-3 py-3">
              <span className="mr-2 text-sm font-bold text-muted">Clicca per aggiungere:</span>
              {shiftTemplates.map((template) => (
                <button
                  key={template.label}
                  className="rounded-[6px] border border-line bg-white px-3 py-2 text-sm font-bold shadow-sm transition hover:bg-slate-50"
                  onClick={() => createShiftFromTemplate(template.label, template.time)}
                >
                  {template.label} <span className="font-semibold text-muted">{template.time}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto thin-scrollbar">
              <div className="min-w-[980px] rounded-[8px] border border-line bg-white">
                <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-line">
                  <div />
                  {baseDays.map(([weekday, day]) => (
                    <div key={weekday} className="border-l border-line px-4 py-4 text-center">
                      <p className="text-xs font-extrabold text-muted">{weekday}</p>
                      <p className={day === "8" ? "mx-auto mt-1 grid size-10 place-items-center rounded-full bg-ink text-lg font-extrabold text-white" : "mt-1 text-lg font-extrabold"}>
                        {day}
                      </p>
                    </div>
                  ))}
                </div>
                {hours.map((hour) => (
                  <div key={hour} className="grid min-h-16 grid-cols-[70px_repeat(7,1fr)] border-b border-line last:border-b-0">
                    <div className="px-3 py-2 text-xs font-bold text-muted">{hour}</div>
                    {baseDays.map(([weekday, day]) => (
                      <div key={`${weekday}-${hour}`} className={day === "8" ? "border-l border-line bg-slate-100/70 p-2" : "border-l border-line bg-white p-2"}>
                        {shifts
                          .filter((shift) => shift.day === weekday && shift.time.startsWith(hour.slice(0, 2)))
                          .map((shift) => (
                            <div key={shift.id} className="rounded-[6px] bg-ink px-2 py-1 text-xs font-bold text-white">
                              {shift.label} · {shift.employee}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shiftModal ? (
        <Modal title="Nuovo turno" onClose={() => setShiftModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitShift(new FormData(event.currentTarget));
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <label className="space-y-2">
              <span className="text-sm font-bold">Dipendente</span>
              <Select name="employee" defaultValue={shiftModal.employee}>
                {employees.map((employee) => (
                  <option key={employee}>{employee}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Giorno</span>
              <Select name="day" defaultValue={shiftModal.day}>
                {baseDays.map(([weekday]) => (
                  <option key={weekday}>{weekday}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Tipo</span>
              <Input name="label" defaultValue={shiftModal.label} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Inizio</span>
              <Input name="start" type="time" defaultValue="18:00" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Fine</span>
              <Input name="end" type="time" defaultValue="23:00" />
            </label>
            <div className="flex items-end justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setShiftModal(null)}>
                Annulla
              </Button>
              <Button type="submit">Crea turno</Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {employeeModal ? (
        <Modal title="Nuovo dipendente" onClose={() => setEmployeeModal(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addEmployee(new FormData(event.currentTarget));
            }}
            className="space-y-4"
          >
            <label className="space-y-2 block">
              <span className="text-sm font-bold">Nome</span>
              <Input name="name" placeholder="Nome e cognome" />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEmployeeModal(false)}>
                Annulla
              </Button>
              <Button type="submit">Aggiungi</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-[560px] rounded-[8px] border border-line bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button type="button" className="grid size-10 place-items-center rounded-[6px] border border-line" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
