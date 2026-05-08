"use client";

import { Armchair, CircleAlert, Clock, Phone, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { roomTables, reservations } from "@/lib/demo-data";
import { readStoredRoomLayout, ROOM_LAYOUT_EVENT, type StoredRoomLayout } from "@/lib/room-layout-storage";
import { cn } from "@/lib/utils";

type LiveRoomTable = {
  id: string;
  name: string;
  seats: number;
  status: string;
  x: number;
  y: number;
};

const statusClass = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300",
  reserved: "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400",
  occupied: "border-ink bg-ink text-white hover:bg-slate-900"
};

const statusLabel = {
  available: "Libero",
  reserved: "Prenotato",
  occupied: "In sala"
};

export function SalaLiveBoard() {
  const [layout, setLayout] = useState<StoredRoomLayout | null>(null);
  const [activeAreaId, setActiveAreaId] = useState("area-main");

  useEffect(() => {
    const storedLayout = readStoredRoomLayout();
    setLayout(storedLayout);
    setActiveAreaId(storedLayout?.areas[0]?.id ?? "area-main");

    function syncLayout() {
      const nextLayout = readStoredRoomLayout();
      setLayout(nextLayout);
      setActiveAreaId((current) => {
        if (!nextLayout?.areas.length) return "area-main";
        return nextLayout.areas.some((area) => area.id === current) ? current : nextLayout.areas[0].id;
      });
    }

    window.addEventListener("storage", syncLayout);
    window.addEventListener(ROOM_LAYOUT_EVENT, syncLayout);

    return () => {
      window.removeEventListener("storage", syncLayout);
      window.removeEventListener(ROOM_LAYOUT_EVENT, syncLayout);
    };
  }, []);

  const areas = layout?.areas.length ? layout.areas : [{ id: "area-main", name: "Sala principale" }];
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0];
  const activeFloorPlan = layout?.floorPlans.find((plan) => plan.areaId === activeArea.id) ?? null;
  const liveTables = useMemo(() => {
    if (!layout?.tables.length) return roomTables;

    return layout.tables.filter((table) => table.areaId === activeArea.id).map((table) => {
      const demoTable = roomTables.find((item) => item.name.toLowerCase() === table.name.toLowerCase());
      const hasReservation = reservations.some((reservation) => reservation.tableNames.includes(table.name));

      return {
        id: table.id,
        name: table.name,
        seats: table.seatsMax,
        status: demoTable?.status ?? (hasReservation ? "reserved" : "available"),
        x: table.positionX,
        y: table.positionY
      } satisfies LiveRoomTable;
    });
  }, [activeArea.id, layout]);

  return (
    <div className="space-y-3">
      {areas.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              className={cn(
                "rounded-[6px] border px-4 py-2 text-sm font-extrabold transition",
                activeArea.id === area.id ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:bg-slate-50"
              )}
              onClick={() => setActiveAreaId(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative isolate overflow-visible rounded-[8px] border border-line bg-slate-50">
        {activeFloorPlan ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 rounded-[8px] bg-cover bg-center opacity-55"
            style={{ backgroundImage: `url(${activeFloorPlan.dataUrl})` }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[8px] bg-[linear-gradient(#e1e8f1_1px,transparent_1px),linear-gradient(90deg,#e1e8f1_1px,transparent_1px)] bg-[size:90px_90px] opacity-80" />
        <div className="relative h-[560px] min-w-[900px]">
          {liveTables.map((table) => {
            const reservation = reservations.find((item) => item.tableNames.includes(table.name));

            return (
              <div
                key={table.id}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-50 focus-within:z-50"
                style={{ left: `${table.x}%`, top: `${table.y}%` }}
              >
                <button
                  type="button"
                  className={cn(
                    "flex size-[112px] flex-col items-center justify-center rounded-[10px] border text-center shadow-sm transition duration-150 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300",
                    statusClass[table.status as keyof typeof statusClass]
                  )}
                  aria-label={`${table.name}, ${statusLabel[table.status as keyof typeof statusLabel]}`}
                >
                  <Armchair className="size-6" />
                  <span className="mt-2 text-2xl font-extrabold">{table.name}</span>
                  <span className="mt-2 text-sm font-extrabold opacity-75">{table.seats} cop.</span>
                </button>

                <div className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-[100] w-[260px] -translate-x-1/2 rounded-[8px] border border-line bg-white p-4 text-left text-ink opacity-0 shadow-2xl ring-1 ring-black/5 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold">{table.name}</p>
                      <p className="text-xs font-bold text-muted">{activeArea.name}</p>
                    </div>
                    <Badge>{statusLabel[table.status as keyof typeof statusLabel]}</Badge>
                  </div>
                  {reservation ? (
                    <div className="space-y-2 text-sm font-semibold">
                      <p className="flex items-center gap-2">
                        <User className="size-4 text-muted" />
                        {reservation.customerName}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="size-4 text-muted" />
                        {reservation.customerPhone}
                      </p>
                      <p className="flex items-center gap-2 text-muted">
                        <Clock className="size-4" />
                        {reservation.startTime}-{reservation.endTime} · {reservation.partySize} coperti
                      </p>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                      <CircleAlert className="size-4" />
                      Nessuna prenotazione assegnata.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {!liveTables.length ? (
            <div className="absolute inset-0 grid place-items-center text-center text-sm font-bold text-muted">
              Nessun tavolo configurato per {activeArea.name}.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
