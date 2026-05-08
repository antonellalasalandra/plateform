"use client";

import { Clock, FileImage, Plus, Save, Sparkles, Table2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { restaurant, roomTables } from "@/lib/demo-data";
import {
  readStoredRoomLayout,
  type StoredDiningArea,
  type StoredFloorPlan,
  type StoredRoomTable,
  writeStoredRoomLayout
} from "@/lib/room-layout-storage";

type DiningAreaConfig = StoredDiningArea;
type TableConfig = StoredRoomTable;

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
  const [floorPlans, setFloorPlans] = useState<StoredFloorPlan[]>([]);
  const [selectedFloorPlanAreaId, setSelectedFloorPlanAreaId] = useState(initialAreas[0].id);
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false);

  const totalSeats = tables.reduce((sum, table) => sum + table.seatsMax, 0);
  const selectedFloorPlanArea = areas.find((area) => area.id === selectedFloorPlanAreaId) ?? areas[0];
  const activeFloorPlan = floorPlans.find((plan) => plan.areaId === selectedFloorPlanAreaId) ?? null;
  const activeAreaTables = tables.filter((table) => table.areaId === selectedFloorPlanAreaId);
  const floorPlanAspect = useMemo(() => {
    if (!activeFloorPlan) return "";
    return `${activeFloorPlan.width} x ${activeFloorPlan.height}px`;
  }, [activeFloorPlan]);

  useEffect(() => {
    const storedLayout = readStoredRoomLayout();
    if (!storedLayout) return;
    if (storedLayout.areas.length) setAreas(storedLayout.areas);
    if (storedLayout.tables.length) setTables(storedLayout.tables);
    setFloorPlans(storedLayout.floorPlans);
    setSelectedFloorPlanAreaId(storedLayout.areas[0]?.id ?? initialAreas[0].id);
  }, []);

  function saveSettings(formData: FormData) {
    const name = String(formData.get("name") || restaurant.name);
    if (!persistRoomLayout(areas, tables, floorPlans)) {
      setNotice("Impostazioni aggiornate in pagina, ma il browser non ha spazio per salvare la planimetria.");
      return;
    }
    setNotice(`Impostazioni salvate per ${name}: ${areas.length} sale, ${tables.length} tavoli, ${totalSeats} coperti configurati.`);
  }

  function addArea() {
    const nextIndex = areas.length + 1;
    const nextArea = { id: crypto.randomUUID(), name: `Sala ${nextIndex}` };
    setAreas((current) => [...current, nextArea]);
    setSelectedFloorPlanAreaId(nextArea.id);
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
    setFloorPlans((current) => current.filter((plan) => plan.areaId !== areaId));
    setSelectedFloorPlanAreaId((current) => (current === areaId ? fallbackArea?.id ?? "area-main" : current));
    setNotice("Sala rimossa. I tavoli sono stati spostati nella prima sala disponibile.");
  }

  function addTable() {
    const nextIndex = tables.length + 1;
    setTables((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        areaId: selectedFloorPlanAreaId || areas[0]?.id || "area-main",
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
    if (!persistRoomLayout(areas, tables, floorPlans)) {
      setNotice("Assetto aggiornato in pagina, ma il browser non ha spazio per salvare la planimetria.");
      return;
    }
    setNotice(`Assetto sala salvato: ${areas.length} sale, ${tables.length} tavoli, ${totalSeats} coperti disponibili.`);
  }

  async function importFloorPlan(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Carica una planimetria in formato immagine: PNG, JPG o WebP.");
      return;
    }

    setIsAnalyzingPlan(true);

    try {
      const analyzedImage = await readAndNormalizeImage(file);
      const nextFloorPlan: StoredFloorPlan = {
        id: activeFloorPlan?.id ?? crypto.randomUUID(),
        areaId: selectedFloorPlanAreaId,
        name: file.name,
        dataUrl: analyzedImage.dataUrl,
        width: analyzedImage.width,
        height: analyzedImage.height,
        analyzedAt: new Date().toISOString()
      };
      const translatedTables = translatePlanToLiveRoom(activeAreaTables, analyzedImage.width, analyzedImage.height);
      const nextTables = mergeAreaTables(tables, selectedFloorPlanAreaId, translatedTables);
      const nextFloorPlans = replaceFloorPlan(floorPlans, nextFloorPlan);

      setFloorPlans(nextFloorPlans);
      setTables(nextTables);
      if (!persistRoomLayout(areas, nextTables, nextFloorPlans)) {
        setNotice("Planimetria analizzata, ma il browser non ha spazio per salvarla. Prova con un'immagine più leggera.");
        return;
      }
      setNotice(`Planimetria analizzata per ${selectedFloorPlanArea?.name ?? "la sala"}: ${translatedTables.length} tavoli tradotti nella Sala live.`);
    } catch {
      setNotice("Non sono riuscito ad analizzare questa planimetria. Prova con un'immagine PNG, JPG o WebP.");
    } finally {
      setIsAnalyzingPlan(false);
    }
  }

  function analyzeCurrentFloorPlan() {
    if (!activeFloorPlan) {
      setNotice("Carica prima una planimetria per questa sala.");
      return;
    }

    const translatedTables = translatePlanToLiveRoom(activeAreaTables, activeFloorPlan.width, activeFloorPlan.height);
    const nextTables = mergeAreaTables(tables, selectedFloorPlanAreaId, translatedTables);
    setTables(nextTables);
    if (!persistRoomLayout(areas, nextTables, floorPlans)) {
      setNotice("Analisi aggiornata in pagina, ma il browser non ha spazio per salvarla.");
      return;
    }
    setNotice(`Analisi aggiornata per ${selectedFloorPlanArea?.name ?? "la sala"}: ${translatedTables.length} tavoli riposizionati.`);
  }

  function removeFloorPlan() {
    const nextFloorPlans = floorPlans.filter((plan) => plan.areaId !== selectedFloorPlanAreaId);
    setFloorPlans(nextFloorPlans);
    if (!persistRoomLayout(areas, tables, nextFloorPlans)) {
      setNotice("Planimetria rimossa in pagina, ma il browser non ha aggiornato il salvataggio locale.");
      return;
    }
    setNotice(`Planimetria rimossa da ${selectedFloorPlanArea?.name ?? "questa sala"}.`);
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
              <div className="mb-5 grid gap-4 rounded-[8px] border border-line bg-slate-50 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-extrabold">
                      <FileImage className="size-5" />
                      Importa planimetria
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-muted">
                      Carica una planimetria per ogni sala: la Sala live userà la planimetria e i tavoli della sala selezionata.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      className="min-w-[190px]"
                      value={selectedFloorPlanAreaId}
                      aria-label="Sala planimetria"
                      onChange={(event) => setSelectedFloorPlanAreaId(event.target.value)}
                    >
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </Select>
                    <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                      <FileImage className="size-5" />
                      Carica immagine
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => {
                          void importFloorPlan(event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <Button type="button" variant="outline" onClick={analyzeCurrentFloorPlan} disabled={!activeFloorPlan || isAnalyzingPlan}>
                      <Sparkles className="size-5" />
                      Analizza
                    </Button>
                  </div>
                </div>

                {activeFloorPlan ? (
                  <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
                    <div className="relative h-64 overflow-hidden rounded-[8px] border border-line bg-white">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-70"
                        style={{ backgroundImage: `url(${activeFloorPlan.dataUrl})` }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(#e1e8f1_1px,transparent_1px),linear-gradient(90deg,#e1e8f1_1px,transparent_1px)] bg-[size:54px_54px] opacity-70" />
                      {activeAreaTables.map((table) => (
                        <div
                          key={table.id}
                          className="absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[8px] border border-emerald-300 bg-white/90 text-xs font-extrabold text-emerald-800 shadow-sm"
                          style={{ left: `${table.positionX}%`, top: `${table.positionY}%` }}
                        >
                          {table.name}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 rounded-[8px] border border-line bg-white p-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase text-muted">Sala e file analizzato</p>
                        <p className="mt-1 text-sm font-extrabold">{selectedFloorPlanArea?.name}</p>
                        <p className="mt-1 break-words text-xs font-bold text-muted">{activeFloorPlan.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[6px] bg-slate-50 p-3">
                          <p className="text-xs font-bold text-muted">Formato</p>
                          <p className="text-sm font-extrabold">{floorPlanAspect}</p>
                        </div>
                        <div className="rounded-[6px] bg-slate-50 p-3">
                          <p className="text-xs font-bold text-muted">Tradotti</p>
                          <p className="text-sm font-extrabold">{activeAreaTables.length} tavoli</p>
                        </div>
                      </div>
                      <div className="rounded-[6px] bg-slate-50 p-3">
                        <p className="text-xs font-bold text-muted">Planimetrie caricate</p>
                        <p className="text-sm font-extrabold">{floorPlans.length} sale</p>
                      </div>
                      <Button type="button" variant="outline" className="w-full" onClick={removeFloorPlan}>
                        <Trash2 className="size-5" />
                        Rimuovi planimetria
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-dashed border-line bg-white px-4 py-8 text-center text-sm font-semibold text-muted">
                    Nessuna planimetria caricata per {selectedFloorPlanArea?.name ?? "questa sala"}. Dopo l'import, la stessa base verrà usata nella Sala live.
                  </div>
                )}
              </div>

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

function persistRoomLayout(areas: DiningAreaConfig[], tables: TableConfig[], floorPlans: StoredFloorPlan[]) {
  return writeStoredRoomLayout({ areas, tables, floorPlans });
}

function replaceFloorPlan(floorPlans: StoredFloorPlan[], nextFloorPlan: StoredFloorPlan) {
  return [...floorPlans.filter((plan) => plan.areaId !== nextFloorPlan.areaId), nextFloorPlan];
}

function mergeAreaTables(allTables: TableConfig[], areaId: string, areaTables: TableConfig[]) {
  const updatedTables = new Map(areaTables.map((table) => [table.id, table]));
  return allTables.map((table) => (table.areaId === areaId ? updatedTables.get(table.id) ?? table : table));
}

function translatePlanToLiveRoom(tables: TableConfig[], width: number, height: number) {
  const count = Math.max(tables.length, 1);
  const aspectRatio = width / Math.max(height, 1);
  const columns = Math.min(count, Math.max(2, Math.ceil(Math.sqrt(count * aspectRatio))));
  const rows = Math.ceil(count / columns);
  const horizontalPadding = aspectRatio >= 1 ? 12 : 18;
  const verticalPadding = aspectRatio >= 1 ? 18 : 12;
  const usableWidth = 100 - horizontalPadding * 2;
  const usableHeight = 100 - verticalPadding * 2;

  return tables
    .slice()
    .sort((a, b) => tableSortValue(a.name) - tableSortValue(b.name))
    .map((table, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const stagger = rows > 1 && row % 2 === 1 ? usableWidth / columns / 2 : 0;
      const positionX = horizontalPadding + ((col + 0.5) * usableWidth) / columns + stagger;
      const positionY = verticalPadding + ((row + 0.5) * usableHeight) / rows;

      return {
        ...table,
        positionX: clampNumber(positionX, 8, 92),
        positionY: clampNumber(positionY, 10, 90)
      };
    });
}

function tableSortValue(name: string) {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

async function readAndNormalizeImage(file: File) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const maxSide = 1600;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));

  if (scale === 1) {
    return { dataUrl: sourceDataUrl, width, height };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) return { dataUrl: sourceDataUrl, width, height };

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.86),
    width: canvas.width,
    height: canvas.height
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}
