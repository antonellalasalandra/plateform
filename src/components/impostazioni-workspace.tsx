"use client";

import { Clock, Plus, Save, Table2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { restaurant, roomTables } from "@/lib/demo-data";

type DiningAreaConfig = {
  id: string;
  name: string;
};

type TableConfig = {
  id: string;
  areaId: string;
  name: string;
  seatsMin: number;
  seatsMax: number;
  positionX: number;
  positionY: number;
};

const initialAreas: DiningAreaConfig[] = [{ id: "area-main", name: "Sala principale" }];

const initialTables: TableConfig[] = roomTables.map((table) => ({
  id: table.id,
  areaId: "area-main",
  name: table.name,
  seatsMin: 1,
  seatsMax: table.seats,
  positionX: table.x,
  positionY: table.y
}));

export function ImpostazioniWorkspace() {
  const [notice, setNotice] = useState("");
  const [areas, setAreas] = useState<DiningAreaConfig[]>(initialAreas);
  const [tables, setTables] = useState<TableConfig[]>(initialTables);

  const totalSeats = tables.reduce((sum, table) => sum + table.seatsMax, 0);

  function saveSettings(formData: FormData) {
    const name = String(formData.get("name") || restaurant.name);
    setNotice(`Impostazioni salvate per ${name}: ${areas.length} sale, ${tables.length} tavoli, ${totalSeats} coperti configurati.`);
  }

  function addArea() {
    const nextIndex = areas.length + 1;
    setAreas((current) => [...current, { id: crypto.randomUUID(), name: `Sala ${nextIndex}` }]);
    setNotice(`Sala ${nextIndex} aggiunta.`);
  }

  function updateArea(areaId: string, name: string) {
    setAreas((current) => current.map((area) => (area.id === areaId ? { ...area, name } : area)));
  }

  function removeArea(areaId: string) {
    if (areas.length === 1) {
      setNotice("Deve restare almeno una sala configurata.");
      return;
    }

    const fallbackArea = areas.find((area) => area.id !== areaId);
    setAreas((current) => current.filter((area) => area.id !== areaId));
    setTables((current) => current.map((table) => (table.areaId === areaId ? { ...table, areaId: fallbackArea?.id ?? current[0]?.areaId ?? "area-main" } : table)));
    setNotice("Sala rimossa. I tavoli sono stati spostati nella prima sala disponibile.");
  }

  function addTable() {
    const nextIndex = tables.length + 1;
    setTables((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        areaId: areas[0]?.id ?? "area-main",
        name: `T${nextIndex}`,
        seatsMin: 1,
        seatsMax: 2,
        positionX: 50,
        positionY: 50
      }
    ]);
    setNotice(`Tavolo T${nextIndex} aggiunto.`);
  }

  function updateTable(tableId: string, patch: Partial<TableConfig>) {
    setTables((current) =>
      current.map((table) => {
        if (table.id !== tableId) return table;
        const nextTable = { ...table, ...patch };
        return {
          ...nextTable,
          seatsMin: clampNumber(nextTable.seatsMin, 1, 99),
          seatsMax: Math.max(clampNumber(nextTable.seatsMax, 1, 99), clampNumber(nextTable.seatsMin, 1, 99)),
          positionX: clampNumber(nextTable.positionX, 0, 100),
          positionY: clampNumber(nextTable.positionY, 0, 100)
        };
      })
    );
  }

  function removeTable(tableId: string) {
    setTables((current) => current.filter((table) => table.id !== tableId));
    setNotice("Tavolo rimosso dalla configurazione sala.");
  }

  function saveRoomLayout() {
    setNotice(`Assetto sala salvato: ${areas.length} sale, ${tables.length} tavoli, ${totalSeats} coperti disponibili.`);
  }

  return (
    <>
      <PageHeader title="Impostazioni" description="Configura informazioni, orari e parametri del locale." />
      {notice ? <Notice message={notice} onClose={() => setNotice("")} /> : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Informazioni locale</CardTitle>
            <CardDescription>Dati di contatto, capienza e link social.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveSettings(new FormData(event.currentTarget));
              }}
              className="grid gap-5 lg:grid-cols-2"
            >
              <label className="space-y-2">
                <span className="text-sm font-bold">Nome locale</span>
                <Input name="name" defaultValue={restaurant.name} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Telefono</span>
                <Input name="phone" defaultValue={restaurant.phone} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Email</span>
                <Input name="email" defaultValue={restaurant.email} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">P.IVA</span>
                <Input name="vat" placeholder="IT00000000000" />
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm font-bold">Indirizzo</span>
                <Input name="address" defaultValue={restaurant.address} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Coperti max / slot</span>
                <Input name="capacity" type="number" defaultValue={restaurant.capacity} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Durata media tavolo (min)</span>
                <Input name="duration" type="number" defaultValue={90} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Anticipo min (ore)</span>
                <Input name="minAdvance" type="number" defaultValue={2} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Anticipo max (giorni)</span>
                <Input name="maxAdvance" type="number" defaultValue={60} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Instagram URL</span>
                <Input name="instagram" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Facebook URL</span>
                <Input name="facebook" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">TripAdvisor URL</span>
                <Input name="tripadvisor" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold">Google Maps URL</span>
                <Input name="maps" />
              </label>
              <div className="lg:col-span-2">
                <Button type="submit">
                  <Save className="size-5" />
                  Salva modifiche
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Turni di servizio
              </CardTitle>
              <CardDescription>Parametri usati dall'availability engine.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ["Pranzo", "12:00", "15:00", "90 min", "30 min"],
                  ["Cena", "19:00", "23:30", "105 min", "30 min"]
                ].map(([name, start, end, duration, interval]) => (
                  <div key={name} className="grid grid-cols-5 gap-3 rounded-[6px] border border-line px-4 py-3 text-sm font-bold">
                    <span>{name}</span>
                    <span className="text-muted">{start}</span>
                    <span className="text-muted">{end}</span>
                    <span className="text-muted">{duration}</span>
                    <span className="text-muted">{interval}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="size-5" />
                  Sala e tavoli
                </CardTitle>
                <CardDescription>Tavoli fisici, sale e capienze usate nelle assegnazioni.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={saveRoomLayout}>
                  <Save className="size-5" />
                  Salva assetto
                </Button>
                <Button type="button" variant="outline" onClick={addArea}>
                  <Plus className="size-5" />
                  Sala
                </Button>
                <Button type="button" onClick={addTable}>
                  <Plus className="size-5" />
                  Tavolo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[6px] border border-line bg-slate-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-muted">Sale</p>
                  <p className="mt-1 text-2xl font-extrabold">{areas.length}</p>
                </div>
                <div className="rounded-[6px] border border-line bg-slate-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-muted">Tavoli</p>
                  <p className="mt-1 text-2xl font-extrabold">{tables.length}</p>
                </div>
                <div className="rounded-[6px] border border-line bg-slate-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-muted">Coperti reali</p>
                  <p className="mt-1 text-2xl font-extrabold">{totalSeats}</p>
                </div>
              </div>

              <div className="mb-5 space-y-3 rounded-[8px] border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold uppercase text-muted">Sale</h3>
                  <span className="text-xs font-bold text-muted">Il nome sala viene usato per organizzare i tavoli.</span>
                </div>
                {areas.map((area) => (
                  <div key={area.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-muted">Nome sala</span>
                      <Input value={area.name} onChange={(event) => updateArea(area.id, event.target.value)} />
                    </label>
                    <Button type="button" variant="outline" className="self-end px-3" onClick={() => removeArea(area.id)} aria-label={`Rimuovi ${area.name}`}>
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto thin-scrollbar">
                <div className="min-w-[760px] space-y-3">
                  <div className="grid grid-cols-[1fr_1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 px-1 text-xs font-extrabold uppercase text-muted">
                    <span>Tavolo</span>
                    <span>Sala</span>
                    <span>Min</span>
                    <span>Max</span>
                    <span>X</span>
                    <span>Y</span>
                    <span />
                  </div>
                  {tables.map((table) => (
                    <div key={table.id} className="grid grid-cols-[1fr_1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 rounded-[6px] border border-line p-2">
                      <Input value={table.name} aria-label="Nome tavolo" onChange={(event) => updateTable(table.id, { name: event.target.value })} />
                      <Select value={table.areaId} aria-label="Sala tavolo" onChange={(event) => updateTable(table.id, { areaId: event.target.value })}>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={table.seatsMin}
                        aria-label="Coperti minimi"
                        onChange={(event) => updateTable(table.id, { seatsMin: numberFromInput(event.currentTarget.value, table.seatsMin) })}
                      />
                      <Input
                        type="number"
                        min={1}
                        value={table.seatsMax}
                        aria-label="Coperti massimi"
                        onChange={(event) => updateTable(table.id, { seatsMax: numberFromInput(event.currentTarget.value, table.seatsMax) })}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={table.positionX}
                        aria-label="Posizione X"
                        onChange={(event) => updateTable(table.id, { positionX: numberFromInput(event.currentTarget.value, table.positionX) })}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={table.positionY}
                        aria-label="Posizione Y"
                        onChange={(event) => updateTable(table.id, { positionY: numberFromInput(event.currentTarget.value, table.positionY) })}
                      />
                      <Button type="button" variant="outline" className="px-3" onClick={() => removeTable(table.id)} aria-label={`Rimuovi ${table.name}`}>
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[6px] border border-dashed border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-muted">
                X e Y sono coordinate percentuali della piantina: servono a posizionare i tavoli nella vista Sala live.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

function numberFromInput(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}
