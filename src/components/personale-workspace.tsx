"use client";

import { ChevronLeft, Download, Eye, Link2, Plus, X } from "lucide-react";
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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
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

  const shiftRows = useMemo(
    () =>
      shifts.map((shift) => ({
        ...shift,
        dayLabel: baseDays.find(([weekday]) => weekday === shift.day)?.join(" ") ?? shift.day
      })),
    [shifts]
  );

  function downloadPdf() {
    const pdfBytes = createShiftPdf({
      title: "Plateform - Pianificazione turni",
      subtitle: `${weekLabel} · ${totalHours.toFixed(1)} ore · costo stimato EUR ${(totalHours * 14).toFixed(2)}`,
      rows: shiftRows
    });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `turni-plateform-${weekLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "settimana"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("PDF dei turni scaricato.");
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
                <Button variant="outline" onClick={() => setPdfPreviewOpen(true)}>
                  <Eye className="size-5" />
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

      {pdfPreviewOpen ? (
        <Modal title="Anteprima PDF turni" size="wide" onClose={() => setPdfPreviewOpen(false)}>
          <div className="max-h-[72vh] overflow-y-auto rounded-[8px] bg-slate-100 p-4">
            <div className="mx-auto min-h-[640px] max-w-[760px] rounded-[4px] bg-white p-8 shadow-sm">
              <div className="border-b border-line pb-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Plateform</p>
                <h3 className="mt-2 text-3xl font-extrabold">Pianificazione turni</h3>
                <p className="mt-2 text-sm font-semibold text-muted">
                  {weekLabel} · {totalHours.toFixed(1)} ore · costo stimato € {(totalHours * 14).toFixed(2)}
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-[6px] border border-line">
                <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr] bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase text-muted">
                  <span>Giorno</span>
                  <span>Dipendente</span>
                  <span>Turno</span>
                  <span>Orario</span>
                </div>
                {shiftRows.length ? (
                  shiftRows.map((shift) => (
                    <div key={shift.id} className="grid grid-cols-[1fr_1.2fr_1fr_1fr] border-t border-line px-4 py-3 text-sm font-semibold">
                      <span>{shift.dayLabel}</span>
                      <span>{shift.employee}</span>
                      <span>{shift.label}</span>
                      <span>{shift.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="border-t border-line px-4 py-8 text-center text-sm font-semibold text-muted">Nessun turno da esportare.</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPdfPreviewOpen(false)}>
              Chiudi
            </Button>
            <Button
              type="button"
              onClick={() => {
                downloadPdf();
                setPdfPreviewOpen(false);
              }}
              disabled={!shiftRows.length}
            >
              <Download className="size-5" />
              Scarica PDF
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({ title, onClose, children, size = "default" }: { title: string; onClose: () => void; children: ReactNode; size?: "default" | "wide" }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className={`${size === "wide" ? "max-w-[980px]" : "max-w-[560px]"} w-full rounded-[8px] border border-line bg-white p-6 shadow-2xl`}>
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

function createShiftPdf({
  title,
  subtitle,
  rows
}: {
  title: string;
  subtitle: string;
  rows: Array<Shift & { dayLabel: string }>;
}) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 48;
  const bottomMargin = 58;
  const pages: string[] = [];
  const visibleRows = rows.length ? rows : [{ id: "empty", employee: "Nessun turno", day: "-", label: "-", time: "-", dayLabel: "-" }];
  let cursorY = 780;
  let commands: string[] = [];

  function text(value: string, x: number, y: number, size = 11, font = "F1") {
    commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function startPage(continued = false) {
    commands = [];
    cursorY = 780;
    text("Plateform", marginX, cursorY, 10);
    cursorY -= 28;
    text(continued ? `${title} - continua` : title, marginX, cursorY, 24);
    cursorY -= 22;
    text(subtitle, marginX, cursorY, 10);
    cursorY -= 24;
    line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY -= 26;
    text("Giorno", marginX, cursorY, 10, "F2");
    text("Dipendente", 150, cursorY, 10, "F2");
    text("Turno", 310, cursorY, 10, "F2");
    text("Orario", 430, cursorY, 10, "F2");
    cursorY -= 12;
    line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY -= 22;
  }

  function finishPage() {
    pages.push(commands.join("\n"));
  }

  startPage();
  visibleRows.forEach((row) => {
    if (cursorY < bottomMargin) {
      finishPage();
      startPage(true);
    }
    text(row.dayLabel, marginX, cursorY);
    text(row.employee, 150, cursorY);
    text(row.label, 310, cursorY);
    text(row.time, 430, cursorY);
    cursorY -= 22;
  });
  finishPage();

  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  const contentObjectIds = pages.map((_, index) => 6 + index * 2);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];

  pages.forEach((stream, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`,
      `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
