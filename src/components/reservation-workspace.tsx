"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { roomTables } from "@/lib/demo-data";
import { readStoredRoomLayout, ROOM_LAYOUT_EVENT, type StoredRoomLayout } from "@/lib/room-layout-storage";
import type { ReservationRow, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<ReservationStatus, string> = {
  pending: "In attesa",
  confirmed: "Confermata",
  seated: "In sala",
  completed: "Completata",
  cancelled: "Cancellata",
  no_show: "No-show"
};

const statusClass: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  seated: "bg-ink text-white border-ink",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-red-50 text-red-700 border-red-200"
};

export function ReservationWorkspace({ initialReservations }: { initialReservations: ReservationRow[] }) {
  const [reservations, setReservations] = useState(initialReservations);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [layout, setLayout] = useState<StoredRoomLayout | null>(null);
  const [reservationAreaId, setReservationAreaId] = useState("area-main");
  const [modal, setModal] = useState<"reservation" | "walkin" | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRow | null>(null);

  useEffect(() => {
    const storedLayout = readStoredRoomLayout();
    setLayout(storedLayout);
    setReservationAreaId(storedLayout?.areas[0]?.id ?? "area-main");

    function syncLayout() {
      const nextLayout = readStoredRoomLayout();
      setLayout(nextLayout);
      setReservationAreaId((current) => {
        if (!nextLayout?.areas.length) return "area-main";
        return nextLayout.areas.some((area) => area.id === current) ? current : nextLayout.areas[0].id;
      });
    }

    window.addEventListener("storage", syncLayout);
    window.addEventListener(ROOM_LAYOUT_EVENT, syncLayout);

    const requestedModal = new URLSearchParams(window.location.search).get("modal");

    if (requestedModal === "walkin" || requestedModal === "reservation") {
      setModal(requestedModal);
      window.history.replaceState(null, "", window.location.pathname);
    }

    return () => {
      window.removeEventListener("storage", syncLayout);
      window.removeEventListener(ROOM_LAYOUT_EVENT, syncLayout);
    };
  }, []);

  const areas = layout?.areas.length ? layout.areas : [{ id: "area-main", name: "Sala principale" }];
  const reservationTables = layout?.tables.length
    ? layout.tables.map((table) => ({ id: table.id, areaId: table.areaId, name: table.name, seats: table.seatsMax }))
    : roomTables.map((table) => ({ id: table.id, areaId: "area-main", name: table.name, seats: table.seats }));
  const activeAreaTables = reservationTables.filter((table) => table.areaId === reservationAreaId);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesQuery =
        reservation.customerName.toLowerCase().includes(query.toLowerCase()) ||
        reservation.customerPhone.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || reservation.status === status;
      const reservationArea = areaForReservation(reservation.tableNames, reservationTables, areas);
      const matchesArea = areaFilter === "all" || reservationArea?.id === areaFilter;
      return matchesQuery && matchesStatus && matchesArea;
    });
  }, [areaFilter, areas, query, reservationTables, reservations, status]);

  function addReservation(formData: FormData) {
    const isWalkin = modal === "walkin";
    const partySize = Number(formData.get("partySize") || 2);
    const startTime = String(formData.get("startTime") || "20:00");
    const tableName = String(formData.get("table") || activeAreaTables[0]?.name || "T2");
    const newReservation: ReservationRow = {
      id: crypto.randomUUID(),
      customerName: isWalkin ? `Walk-in ${partySize} coperti` : String(formData.get("name") || "Nuova prenotazione"),
      customerPhone: isWalkin ? "-" : String(formData.get("phone") || "-"),
      partySize,
      date: "2026-05-07",
      startTime,
      endTime: endTime(startTime, partySize),
      tableNames: [tableName],
      status: isWalkin ? "seated" : "confirmed",
      source: isWalkin ? "walkin" : "phone",
      notes: String(formData.get("notes") || "")
    };

    setReservations((current) => [newReservation, ...current]);
    setModal(null);
  }

  function updateReservationStatus(id: string, nextStatus: ReservationStatus) {
    setReservations((current) =>
      current.map((reservation) => (reservation.id === id ? { ...reservation, status: nextStatus } : reservation))
    );
    setSelectedReservation((current) => (current?.id === id ? { ...current, status: nextStatus } : current));
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <Button onClick={() => openModal("walkin", areas[0]?.id ?? "area-main")}>
          <UserPlus className="size-5" />
          Aggiungi walk-in
        </Button>
        <Button onClick={() => openModal("reservation", areas[0]?.id ?? "area-main")}>
          <CalendarPlus className="size-5" />
          Nuova prenotazione
        </Button>
      </div>

      <Card className="p-5">
        <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
              placeholder="Cerca per nome o telefono"
            />
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="confirmed">Confermate</option>
            <option value="seated">In sala</option>
            <option value="completed">Completate</option>
            <option value="cancelled">Cancellate</option>
          </Select>
          <Select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
            <option value="all">Tutte le sale</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-sm font-extrabold text-muted">
                <th className="px-4 py-3">Data & Ora</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3">Coperti</th>
                <th className="px-4 py-3">Tavolo</th>
                <th className="px-4 py-3">Sala</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-slate-100 text-sm font-semibold last:border-0">
                    <td className="px-4 py-4">
                      <span className="font-extrabold">{reservation.startTime}</span>
                      <span className="block text-muted">{reservation.date}</span>
                    </td>
                    <td className="px-4 py-4 font-extrabold">{reservation.customerName}</td>
                    <td className="px-4 py-4 text-muted">{reservation.customerPhone}</td>
                    <td className="px-4 py-4">{reservation.partySize}</td>
                    <td className="px-4 py-4">{reservation.tableNames.join(", ")}</td>
                    <td className="px-4 py-4 text-muted">{areaForReservation(reservation.tableNames, reservationTables, areas)?.name ?? "Sala principale"}</td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded-[999px] border px-3 py-1 text-xs font-extrabold", statusClass[reservation.status])}>
                        {statusLabel[reservation.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setSelectedReservation(reservation)}>
                        Vedi
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="h-40 text-center text-sm font-bold text-muted">
                    Nessuna prenotazione trovata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addReservation(new FormData(event.currentTarget));
            }}
            className="w-full max-w-[560px] rounded-[8px] border border-line bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold">{modal === "walkin" ? "Aggiungi walk-in" : "Nuova prenotazione"}</h2>
                <p className="text-sm font-semibold text-muted">Il backend ricalcola sempre la disponibilità prima del salvataggio.</p>
              </div>
              <button type="button" className="grid size-10 place-items-center rounded-[6px] border border-line" onClick={() => setModal(null)}>
                <X className="size-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {modal === "reservation" ? (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">Nome</span>
                    <Input name="name" defaultValue="Nuovo cliente" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">Telefono</span>
                    <Input name="phone" defaultValue="+39 " />
                  </label>
                </>
              ) : null}
              <label className="space-y-2">
                <span className="text-sm font-bold">Coperti</span>
                <Input name="partySize" type="number" min={1} defaultValue={modal === "walkin" ? 3 : 2} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Ora</span>
                <Input name="startTime" type="time" defaultValue="20:00" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Sala</span>
                <Select value={reservationAreaId} onChange={(event) => setReservationAreaId(event.target.value)}>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Tavolo</span>
                <Select key={reservationAreaId} name="table" defaultValue={activeAreaTables[0]?.name ?? ""}>
                  {activeAreaTables.length ? (
                    activeAreaTables.map((table) => (
                      <option key={table.id} value={table.name}>
                        {table.name} · {table.seats} cop.
                      </option>
                    ))
                  ) : (
                    <option value="">Nessun tavolo configurato</option>
                  )}
                </Select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-bold">Note</span>
                <Input name="notes" placeholder="Note operative" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Annulla
              </Button>
              <Button type="submit">Conferma</Button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedReservation ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-[560px] rounded-[8px] border border-line bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold">{selectedReservation.customerName}</h2>
                <p className="text-sm font-semibold text-muted">
                  {selectedReservation.date} · {selectedReservation.startTime}-{selectedReservation.endTime}
                </p>
              </div>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-[6px] border border-line"
                onClick={() => setSelectedReservation(null)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid gap-3 rounded-[8px] border border-line bg-slate-50 p-4 text-sm font-semibold">
              <p>
                Telefono: <span className="font-extrabold">{selectedReservation.customerPhone}</span>
              </p>
              <p>
                Coperti: <span className="font-extrabold">{selectedReservation.partySize}</span>
              </p>
              <p>
                Tavolo: <span className="font-extrabold">{selectedReservation.tableNames.join(", ")}</span>
              </p>
              <p>
                Sala: <span className="font-extrabold">{areaForReservation(selectedReservation.tableNames, reservationTables, areas)?.name ?? "Sala principale"}</span>
              </p>
              <p>
                Origine: <span className="font-extrabold">{selectedReservation.source}</span>
              </p>
              <p>
                Stato: <span className="font-extrabold">{statusLabel[selectedReservation.status]}</span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => updateReservationStatus(selectedReservation.id, "cancelled")}>
                Cancella
              </Button>
              <Button variant="outline" onClick={() => updateReservationStatus(selectedReservation.id, "seated")}>
                Segna in sala
              </Button>
              <Button onClick={() => updateReservationStatus(selectedReservation.id, "completed")}>Completa</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  function openModal(nextModal: "reservation" | "walkin", areaId: string) {
    setReservationAreaId(areaId);
    setModal(nextModal);
  }
}

function endTime(start: string, partySize: number) {
  const [hours, minutes] = start.split(":").map(Number);
  const duration = partySize <= 2 ? 90 : partySize <= 4 ? 105 : 120;
  const total = hours * 60 + minutes + duration;
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function areaForReservation(
  tableNames: string[],
  tables: Array<{ areaId: string; name: string }>,
  areas: Array<{ id: string; name: string }>
) {
  const table = tables.find((item) => tableNames.some((tableName) => tableName.toLowerCase() === item.name.toLowerCase()));
  if (!table) return null;
  return areas.find((area) => area.id === table.areaId) ?? { id: table.areaId, name: "Sala principale" };
}
