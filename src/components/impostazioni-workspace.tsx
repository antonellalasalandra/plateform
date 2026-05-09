"use client";

import { CheckCircle2, Clock, FileImage, Plus, RefreshCw, Save, ScanSearch, Sparkles, Table2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Notice } from "@/components/notice";
import { OpenAIConnectionCard } from "@/components/openai-connection-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { restaurant, roomTables } from "@/lib/demo-data";
import { readOpenAIConnection } from "@/lib/openai-connection-storage";
import {
  readStoredRoomLayout,
  type StoredDiningArea,
  type StoredFloorPlan,
  type StoredRoomTable,
  writeStoredRoomLayout
} from "@/lib/room-layout-storage";

type DiningAreaConfig = StoredDiningArea;
type TableConfig = StoredRoomTable;
type DetectedRoomKind = "dining" | "kitchen" | "service" | "other";

type DetectedFloorRoom = {
  id: string;
  name: string;
  kind: DetectedRoomKind;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  enabled: boolean;
};

type FullPlanAnalysis = {
  floorPlan: StoredFloorPlan;
  rooms: DetectedFloorRoom[];
};

type DetectedPlanTable = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

const roomKindLabels: Record<DetectedRoomKind, string> = {
  dining: "Sala",
  kitchen: "Cucina",
  service: "Servizi",
  other: "Altro"
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
  const [floorPlans, setFloorPlans] = useState<StoredFloorPlan[]>([]);
  const [selectedFloorPlanAreaId, setSelectedFloorPlanAreaId] = useState(initialAreas[0].id);
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false);
  const [fullPlanAnalysis, setFullPlanAnalysis] = useState<FullPlanAnalysis | null>(null);

  const totalSeats = tables.reduce((sum, table) => sum + table.seatsMax, 0);
  const selectedFloorPlanArea = areas.find((area) => area.id === selectedFloorPlanAreaId) ?? areas[0];
  const activeFloorPlan = floorPlans.find((plan) => plan.areaId === selectedFloorPlanAreaId) ?? null;
  const activeAreaTables = tables.filter((table) => table.areaId === selectedFloorPlanAreaId);
  const operationalRoomCount = fullPlanAnalysis?.rooms.filter((room) => room.enabled && room.kind === "dining").length ?? 0;
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
        analyzedAt: new Date().toISOString(),
        sourceType: "single-room"
      };
      const localDetectedTables = await detectTablesForFloorPlan(nextFloorPlan);
      const aiDetectedTables = await detectTablesWithOpenAI(nextFloorPlan);
      const detectedTables = chooseBetterTableDetection(localDetectedTables, aiDetectedTables);
      const translatedTables =
        detectedTables.length >= Math.max(activeAreaTables.length, 3)
          ? buildTablesFromPlanDetection(activeAreaTables, selectedFloorPlanAreaId, detectedTables)
          : translatePlanToLiveRoom(activeAreaTables, analyzedImage.width, analyzedImage.height);
      const nextTables = mergeAreaTables(tables, selectedFloorPlanAreaId, translatedTables);
      const nextFloorPlans = replaceFloorPlan(floorPlans, nextFloorPlan);
      const analysisMode =
        aiDetectedTables.length && detectedTables === aiDetectedTables
          ? "riconosciuti con ChatGPT"
          : detectedTables.length >= Math.max(activeAreaTables.length, 3)
            ? "riconosciuti dalla planimetria"
            : "tradotti dall'assetto configurato";

      setFloorPlans(nextFloorPlans);
      setTables(nextTables);
      if (!persistRoomLayout(areas, nextTables, nextFloorPlans)) {
        setNotice("Planimetria analizzata, ma il browser non ha spazio per salvarla. Prova con un'immagine più leggera.");
        return;
      }
      setNotice(`Planimetria analizzata per ${selectedFloorPlanArea?.name ?? "la sala"}: ${translatedTables.length} tavoli ${analysisMode}.`);
    } catch {
      setNotice("Non sono riuscito ad analizzare questa planimetria. Prova con un'immagine PNG, JPG o WebP.");
    } finally {
      setIsAnalyzingPlan(false);
    }
  }

  async function importCompleteFloorPlan(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Carica una planimetria completa in formato immagine: PNG, JPG o WebP.");
      return;
    }

    setIsAnalyzingPlan(true);

    try {
      const analyzedImage = await readAndNormalizeImage(file);
      const localDetectedRooms = await detectRoomsFromPlan(analyzedImage.dataUrl, analyzedImage.width, analyzedImage.height);
      const nextFloorPlan: StoredFloorPlan = {
        id: crypto.randomUUID(),
        areaId: "complete-plan",
        name: file.name,
        dataUrl: analyzedImage.dataUrl,
        width: analyzedImage.width,
        height: analyzedImage.height,
        analyzedAt: new Date().toISOString(),
        sourceType: "complete-plan"
      };
      const aiAnalysis = await analyzeCompletePlanWithOpenAI(nextFloorPlan);
      const detectedRooms = aiAnalysis.rooms.length >= localDetectedRooms.length ? aiAnalysis.rooms : localDetectedRooms;

      setFullPlanAnalysis({ floorPlan: nextFloorPlan, rooms: detectedRooms });
      setNotice(
        `Analisi pronta: ho trovato ${detectedRooms.length} ambienti candidati${aiAnalysis.rooms.length ? " con ChatGPT" : ""}. Rinomina le sale e conferma quali usare nelle prenotazioni.`
      );
    } catch {
      setNotice("Non sono riuscito ad analizzare questa planimetria completa. Prova con un'immagine più nitida o meno compressa.");
    } finally {
      setIsAnalyzingPlan(false);
    }
  }

  function updateDetectedRoom(roomId: string, patch: Partial<DetectedFloorRoom>) {
    setFullPlanAnalysis((current) => {
      if (!current) return current;

      return {
        ...current,
        rooms: current.rooms.map((room) => {
          if (room.id !== roomId) return room;
          const nextKind = patch.kind ?? room.kind;

          return {
            ...room,
            ...patch,
            enabled: nextKind === "dining" ? patch.enabled ?? room.enabled : false,
            kind: nextKind
          };
        })
      };
    });
  }

  async function applyCompleteFloorPlanAnalysis() {
    if (!fullPlanAnalysis) {
      setNotice("Carica prima una planimetria completa da analizzare.");
      return;
    }

    const acceptedRooms = fullPlanAnalysis.rooms.filter((room) => room.enabled && room.kind === "dining");
    if (!acceptedRooms.length) {
      setNotice("Segna almeno un ambiente come Sala per creare le sale operative.");
      return;
    }

    setIsAnalyzingPlan(true);

    const nextAreas = acceptedRooms.map((room, index) => {
      const existingArea = areas.find((area) => area.name.trim().toLowerCase() === room.name.trim().toLowerCase());
      return {
        id: existingArea?.id ?? crypto.randomUUID(),
        name: room.name.trim() || `Sala ${index + 1}`
      };
    });
    let detectedTables: DetectedPlanTable[] = [];

    try {
      const localTables = await detectTablesFromPlan(fullPlanAnalysis.floorPlan.dataUrl, fullPlanAnalysis.floorPlan.width, fullPlanAnalysis.floorPlan.height);
      const aiTables = await detectTablesWithOpenAI(fullPlanAnalysis.floorPlan);
      detectedTables = chooseBetterTableDetection(localTables, aiTables);
    } catch {
      detectedTables = [];
    }

    const nextTables = buildTablesForDetectedRooms(tables.length ? tables : initialTables, acceptedRooms, nextAreas, detectedTables);
    const nextFloorPlans = acceptedRooms.map((room, index) => {
      const area = nextAreas[index];

      return {
        id: floorPlans.find((plan) => plan.areaId === area.id)?.id ?? crypto.randomUUID(),
        areaId: area.id,
        name: `${fullPlanAnalysis.floorPlan.name} · ${area.name}`,
        dataUrl: fullPlanAnalysis.floorPlan.dataUrl,
        width: fullPlanAnalysis.floorPlan.width,
        height: fullPlanAnalysis.floorPlan.height,
        analyzedAt: new Date().toISOString(),
        sourceType: "complete-plan",
        sourceX: room.x,
        sourceY: room.y,
        sourceWidth: room.width,
        sourceHeight: room.height
      } satisfies StoredFloorPlan;
    });

    setAreas(nextAreas);
    setTables(nextTables);
    setFloorPlans(nextFloorPlans);
    setSelectedFloorPlanAreaId(nextAreas[0]?.id ?? "area-main");
    setFullPlanAnalysis(null);

    if (!persistRoomLayout(nextAreas, nextTables, nextFloorPlans)) {
      setNotice("Sale create in pagina, ma il browser non ha spazio per salvare la planimetria completa.");
      setIsAnalyzingPlan(false);
      return;
    }

    setIsAnalyzingPlan(false);
    setNotice(`Planimetria completa applicata: ${nextAreas.length} sale operative e ${nextTables.length} tavoli ${detectedTables.length ? "rilevati/assegnati" : "distribuiti"}.`);
  }

  function analyzeCurrentFloorPlan() {
    if (!activeFloorPlan) {
      setNotice("Carica prima una planimetria per questa sala.");
      return;
    }

    void analyzeTablesForActiveFloorPlan(activeFloorPlan);
  }

  async function analyzeTablesForActiveFloorPlan(floorPlan: StoredFloorPlan) {
    setIsAnalyzingPlan(true);

    try {
      const localDetectedTables = await detectTablesForFloorPlan(floorPlan);
      const aiDetectedTables = await detectTablesWithOpenAI(floorPlan);
      const detectedTables = chooseBetterTableDetection(localDetectedTables, aiDetectedTables);
      const translatedTables =
        detectedTables.length >= Math.max(activeAreaTables.length, 3)
          ? buildTablesFromPlanDetection(activeAreaTables, selectedFloorPlanAreaId, detectedTables)
          : translatePlanToLiveRoom(activeAreaTables, floorPlan.width, floorPlan.height);
      const nextTables = mergeAreaTables(tables, selectedFloorPlanAreaId, translatedTables);
      const analysisMode =
        aiDetectedTables.length && detectedTables === aiDetectedTables
          ? "rilevati con ChatGPT"
          : detectedTables.length >= Math.max(activeAreaTables.length, 3)
            ? "rilevati dall'immagine"
            : "riallineati dall'assetto esistente";

      setTables(nextTables);
      if (!persistRoomLayout(areas, nextTables, floorPlans)) {
        setNotice("Analisi aggiornata in pagina, ma il browser non ha spazio per salvarla.");
        return;
      }
      setNotice(`Analisi aggiornata per ${selectedFloorPlanArea?.name ?? "la sala"}: ${translatedTables.length} tavoli ${analysisMode}.`);
    } catch {
      setNotice("Non sono riuscito a rilevare i tavoli da questa immagine. Ho mantenuto l'assetto configurato.");
    } finally {
      setIsAnalyzingPlan(false);
    }
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

  function clearCompletePlanAnalysis() {
    setFullPlanAnalysis(null);
    setNotice("Analisi planimetria completa rimossa. Puoi caricare una nuova immagine.");
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

        <OpenAIConnectionCard />

        <section className="grid gap-6">
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
                <div className="grid gap-4 rounded-[8px] border border-line bg-white p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-extrabold">
                        <ScanSearch className="size-5" />
                        Analizza planimetria completa
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-muted">
                        Usa questo flusso per piante con più sale, cucina, corridoi e servizi: Plateform separa gli ambienti e ti chiede quali sono sale operative.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                        {fullPlanAnalysis ? <RefreshCw className="size-5" /> : <FileImage className="size-5" />}
                        {fullPlanAnalysis ? "Cambia immagine" : "Carica / cambia"}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            void importCompleteFloorPlan(event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {fullPlanAnalysis ? (
                        <Button type="button" variant="outline" onClick={clearCompletePlanAnalysis}>
                          <Trash2 className="size-5" />
                          Rimuovi
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {fullPlanAnalysis ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                      <div
                        className="relative w-full overflow-hidden rounded-[8px] border border-line bg-white"
                        style={{ aspectRatio: `${fullPlanAnalysis.floorPlan.width} / ${fullPlanAnalysis.floorPlan.height}` }}
                      >
                        <img
                          src={fullPlanAnalysis.floorPlan.dataUrl}
                          alt="Planimetria completa analizzata"
                          className="absolute inset-0 h-full w-full object-fill opacity-75"
                        />
                        {fullPlanAnalysis.rooms.map((room) => (
                          <button
                            key={room.id}
                            type="button"
                            className={`absolute rounded-[6px] border-2 text-left shadow-sm transition hover:shadow-lg ${
                              room.kind === "dining"
                                ? "border-emerald-400 bg-emerald-100/70 text-emerald-900"
                                : "border-slate-300 bg-white/70 text-slate-700"
                            } ${room.enabled ? "ring-2 ring-emerald-500/30" : "opacity-75"}`}
                            style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }}
                            onClick={() => updateDetectedRoom(room.id, { enabled: room.kind === "dining" ? !room.enabled : false })}
                          >
                            <span className="block truncate px-2 py-1 text-xs font-extrabold">{room.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[6px] border border-line bg-slate-50 p-3">
                          <p className="text-xs font-extrabold uppercase text-muted">Ambienti trovati</p>
                          <p className="mt-1 text-sm font-semibold text-muted">
                            Dai un nome alle sale, imposta il tipo e lascia attive solo quelle che devono comparire in Sala live e nelle prenotazioni.
                          </p>
                        </div>
                        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 thin-scrollbar">
                          {fullPlanAnalysis.rooms.map((room, index) => (
                            <div key={room.id} className="grid gap-2 rounded-[6px] border border-line bg-white p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-extrabold uppercase text-muted">Ambiente {index + 1}</span>
                                <label className="flex items-center gap-2 text-xs font-extrabold text-muted">
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-slate-900"
                                    checked={room.enabled}
                                    disabled={room.kind !== "dining"}
                                    onChange={(event) => updateDetectedRoom(room.id, { enabled: event.currentTarget.checked })}
                                  />
                                  Usa come sala
                                </label>
                              </div>
                              <Input value={room.name} aria-label="Nome ambiente" onChange={(event) => updateDetectedRoom(room.id, { name: event.target.value })} />
                              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                <Select
                                  value={room.kind}
                                  aria-label="Tipo ambiente"
                                  onChange={(event) => {
                                    const kind = event.target.value as DetectedRoomKind;
                                    updateDetectedRoom(room.id, { kind, enabled: kind === "dining" });
                                  }}
                                >
                                  {Object.entries(roomKindLabels).map(([kind, label]) => (
                                    <option key={kind} value={kind}>
                                      {label}
                                    </option>
                                  ))}
                                </Select>
                                <span className="rounded-[6px] bg-slate-50 px-3 py-2 text-xs font-extrabold text-muted">
                                  {Math.round(room.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button type="button" className="w-full" onClick={() => void applyCompleteFloorPlanAnalysis()} disabled={!operationalRoomCount || isAnalyzingPlan}>
                          <CheckCircle2 className="size-5" />
                          Crea {operationalRoomCount || ""} sale operative
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-extrabold">
                      <FileImage className="size-5" />
                      Planimetria per sala
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-muted">
                      Usa questo percorso per caricare o correggere una planimetria già riferita a una sola sala.
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
                      Carica / cambia immagine
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
                          <p className="text-xs font-bold text-muted">Tavoli</p>
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

async function detectTablesWithOpenAI(floorPlan: StoredFloorPlan) {
  const connection = readOpenAIConnection();
  if (!connection) return [];

  try {
    const response = await fetch("/api/ai/floor-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openai-api-key": connection.apiKey
      },
      body: JSON.stringify({
        imageDataUrl: floorPlan.dataUrl,
        mode: "single-room",
        model: connection.model
      })
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { tables?: DetectedPlanTable[] };
    return sanitizeDetectedTables(data.tables);
  } catch {
    return [];
  }
}

async function analyzeCompletePlanWithOpenAI(floorPlan: StoredFloorPlan) {
  const connection = readOpenAIConnection();
  if (!connection) return { rooms: [] as DetectedFloorRoom[], tables: [] as DetectedPlanTable[] };

  try {
    const response = await fetch("/api/ai/floor-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openai-api-key": connection.apiKey
      },
      body: JSON.stringify({
        imageDataUrl: floorPlan.dataUrl,
        mode: "complete-plan",
        model: connection.model
      })
    });
    if (!response.ok) return { rooms: [], tables: [] };
    const data = (await response.json()) as { rooms?: Array<Partial<DetectedFloorRoom>>; tables?: DetectedPlanTable[] };

    return {
      rooms: sanitizeDetectedRooms(data.rooms),
      tables: sanitizeDetectedTables(data.tables)
    };
  } catch {
    return { rooms: [], tables: [] };
  }
}

function chooseBetterTableDetection(localTables: DetectedPlanTable[], aiTables: DetectedPlanTable[]) {
  if (!aiTables.length) return localTables;
  if (!localTables.length) return aiTables;
  const expectedImprovement = aiTables.length >= localTables.length + 2;
  const higherConfidence = averageTableConfidence(aiTables) >= averageTableConfidence(localTables) + 0.08;
  return expectedImprovement || higherConfidence ? aiTables : localTables;
}

function averageTableConfidence(tables: DetectedPlanTable[]) {
  if (!tables.length) return 0;
  return tables.reduce((sum, table) => sum + table.confidence, 0) / tables.length;
}

function sanitizeDetectedTables(tables: unknown) {
  if (!Array.isArray(tables)) return [];

  return tables
    .filter((table): table is DetectedPlanTable => {
      const candidate = table as Partial<DetectedPlanTable>;
      return ["x", "y", "width", "height", "confidence"].every((key) => typeof candidate[key as keyof DetectedPlanTable] === "number");
    })
    .map((table) => ({
      x: clampDecimal(table.x, 0, 100),
      y: clampDecimal(table.y, 0, 100),
      width: clampDecimal(table.width, 0.8, 30),
      height: clampDecimal(table.height, 0.8, 30),
      confidence: clampDecimal(table.confidence, 0.1, 0.99)
    }))
    .filter((table) => table.x >= 0 && table.x <= 100 && table.y >= 0 && table.y <= 100)
    .slice(0, 40);
}

function sanitizeDetectedRooms(rooms: unknown) {
  if (!Array.isArray(rooms)) return [];

  let diningIndex = 0;
  return rooms
    .filter((room) => {
      const candidate = room as Partial<DetectedFloorRoom>;
      return ["x", "y", "width", "height", "confidence"].every((key) => typeof candidate[key as keyof DetectedFloorRoom] === "number");
    })
    .map((room, index) => {
      const candidate = room as Partial<DetectedFloorRoom>;
      const kind = isDetectedRoomKind(candidate.kind) ? candidate.kind : "other";
      if (kind === "dining") diningIndex += 1;

      return {
        id: crypto.randomUUID(),
        name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : kind === "dining" ? `Sala ${diningIndex}` : `Ambiente ${index + 1}`,
        kind,
        x: clampDecimal(candidate.x ?? 0, 0, 98),
        y: clampDecimal(candidate.y ?? 0, 0, 98),
        width: clampDecimal(candidate.width ?? 2, 2, 100),
        height: clampDecimal(candidate.height ?? 2, 2, 100),
        confidence: clampDecimal(candidate.confidence ?? 0.5, 0.1, 0.99),
        enabled: kind === "dining"
      } satisfies DetectedFloorRoom;
    })
    .filter((room) => room.width * room.height >= 2)
    .slice(0, 12);
}

function isDetectedRoomKind(kind: unknown): kind is DetectedRoomKind {
  return kind === "dining" || kind === "kitchen" || kind === "service" || kind === "other";
}

function mergeAreaTables(allTables: TableConfig[], areaId: string, areaTables: TableConfig[]) {
  const updatedTables = new Map(areaTables.map((table) => [table.id, table]));
  return allTables.map((table) => (table.areaId === areaId ? updatedTables.get(table.id) ?? table : table));
}

function buildTablesFromPlanDetection(sourceTables: TableConfig[], areaId: string, detectedTables: DetectedPlanTable[]) {
  const sortedTables = sourceTables.slice().sort((a, b) => tableSortValue(a.name) - tableSortValue(b.name));

  return detectedTables
    .slice()
    .sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x))
    .map((detectedTable, index) => {
      const sourceTable = sortedTables[index];

      return {
        id: sourceTable?.id ?? crypto.randomUUID(),
        areaId,
        name: sourceTable?.name ?? `T${index + 1}`,
        seatsMin: sourceTable?.seatsMin ?? 1,
        seatsMax: sourceTable?.seatsMax ?? inferSeatsFromDetectedTable(detectedTable, index),
        positionX: clampNumber(detectedTable.x, 4, 96),
        positionY: clampNumber(detectedTable.y, 4, 96)
      } satisfies TableConfig;
    });
}

function inferSeatsFromDetectedTable(table: DetectedPlanTable, index: number) {
  const footprint = table.width * table.height;
  if (footprint > 35) return 6;
  if (footprint > 18 || index % 3 === 2) return 4;
  return 2;
}

function buildTablesForDetectedRooms(sourceTables: TableConfig[], rooms: DetectedFloorRoom[], areas: DiningAreaConfig[], planTables: DetectedPlanTable[] = []) {
  const sortedTables = sourceTables.slice().sort((a, b) => tableSortValue(a.name) - tableSortValue(b.name));
  const totalTables = Math.max(sortedTables.length, rooms.length * 2);
  const roomTableCounts = distributeTableCounts(rooms, totalTables);
  const nextTables: TableConfig[] = [];
  const usedIds = new Set<string>();
  let sourceIndex = 0;
  let tableNumber = 1;

  rooms.forEach((room, roomIndex) => {
    const area = areas[roomIndex];
    const detectedTablesInRoom = normalizeTablesForDetectedRoom(planTables, room);
    const positions =
      detectedTablesInRoom.length >= 2
        ? detectedTablesInRoom.map((table) => ({ x: table.x, y: table.y }))
        : tablePositionsForRoom(roomTableCounts[roomIndex] ?? 1, room.width / Math.max(room.height, 1));

    positions.forEach((position) => {
      const sourceTable = sortedTables[sourceIndex];
      sourceIndex += 1;
      const id = sourceTable && !usedIds.has(sourceTable.id) ? sourceTable.id : crypto.randomUUID();
      usedIds.add(id);

      nextTables.push({
        id,
        areaId: area.id,
        name: sourceTable?.name ?? `T${tableNumber}`,
        seatsMin: sourceTable?.seatsMin ?? 1,
        seatsMax: sourceTable?.seatsMax ?? (tableNumber % 3 === 0 ? 4 : 2),
        positionX: position.x,
        positionY: position.y
      });
      tableNumber += 1;
    });
  });

  return nextTables;
}

function normalizeTablesForDetectedRoom(planTables: DetectedPlanTable[], room: DetectedFloorRoom) {
  const roomRight = room.x + room.width;
  const roomBottom = room.y + room.height;

  return planTables
    .filter((table) => table.x >= room.x && table.x <= roomRight && table.y >= room.y && table.y <= roomBottom)
    .map((table) => ({
      ...table,
      x: clampNumber(((table.x - room.x) / room.width) * 100, 8, 92),
      y: clampNumber(((table.y - room.y) / room.height) * 100, 10, 90)
    }))
    .sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x));
}

function distributeTableCounts(rooms: DetectedFloorRoom[], totalTables: number) {
  if (!rooms.length) return [];

  const baseCount = totalTables >= rooms.length * 2 ? 2 : 1;
  const counts = rooms.map(() => baseCount);
  let remainingTables = Math.max(0, totalTables - counts.reduce((sum, count) => sum + count, 0));
  const weights = rooms.map((room) => Math.max(room.width * room.height, 1));

  while (remainingTables > 0) {
    let targetIndex = 0;
    let targetScore = -Infinity;

    weights.forEach((weight, index) => {
      const score = weight / counts[index];
      if (score > targetScore) {
        targetScore = score;
        targetIndex = index;
      }
    });

    counts[targetIndex] += 1;
    remainingTables -= 1;
  }

  return counts;
}

function tablePositionsForRoom(count: number, aspectRatio: number) {
  const safeCount = Math.max(count, 1);
  const columns = Math.min(safeCount, Math.max(2, Math.ceil(Math.sqrt(safeCount * Math.max(aspectRatio, 0.5)))));
  const rows = Math.ceil(safeCount / columns);
  const horizontalPadding = aspectRatio >= 1 ? 14 : 20;
  const verticalPadding = aspectRatio >= 1 ? 18 : 14;
  const usableWidth = 100 - horizontalPadding * 2;
  const usableHeight = 100 - verticalPadding * 2;

  return Array.from({ length: safeCount }, (_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const stagger = rows > 1 && row % 2 === 1 ? usableWidth / columns / 2 : 0;

    return {
      x: clampNumber(horizontalPadding + ((col + 0.5) * usableWidth) / columns + stagger, 8, 92),
      y: clampNumber(verticalPadding + ((row + 0.5) * usableHeight) / rows, 10, 90)
    };
  });
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

type TableComponent = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
};

async function detectTablesForFloorPlan(floorPlan: StoredFloorPlan) {
  const detectedTables = await detectTablesFromPlan(floorPlan.dataUrl, floorPlan.width, floorPlan.height);

  if (
    floorPlan.sourceType !== "complete-plan" ||
    typeof floorPlan.sourceX !== "number" ||
    typeof floorPlan.sourceY !== "number" ||
    typeof floorPlan.sourceWidth !== "number" ||
    typeof floorPlan.sourceHeight !== "number"
  ) {
    return detectedTables;
  }

  return detectedTables
    .filter((table) => {
      const right = floorPlan.sourceX! + floorPlan.sourceWidth!;
      const bottom = floorPlan.sourceY! + floorPlan.sourceHeight!;
      return table.x >= floorPlan.sourceX! && table.x <= right && table.y >= floorPlan.sourceY! && table.y <= bottom;
    })
    .map((table) => ({
      ...table,
      x: ((table.x - floorPlan.sourceX!) / floorPlan.sourceWidth!) * 100,
      y: ((table.y - floorPlan.sourceY!) / floorPlan.sourceHeight!) * 100,
      width: (table.width / floorPlan.sourceWidth!) * 100,
      height: (table.height / floorPlan.sourceHeight!) * 100
    }));
}

async function detectTablesFromPlan(dataUrl: string, width: number, height: number) {
  const image = await loadImage(dataUrl);
  const sampleScale = Math.min(1, 720 / Math.max(width, height));
  const sampleWidth = Math.max(160, Math.round(width * sampleScale));
  const sampleHeight = Math.max(160, Math.round(height * sampleScale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return [];

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const furnitureMask = new Uint8Array(sampleWidth * sampleHeight);

  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const pixelIndex = (y * sampleWidth + x) * 4;
      const alpha = imageData[pixelIndex + 3];
      const red = imageData[pixelIndex];
      const green = imageData[pixelIndex + 1];
      const blue = imageData[pixelIndex + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const saturation = colorSaturation(red, green, blue);
      const isFurnitureStroke = alpha > 32 && luminance < 205 && saturation < 0.45;

      if (isFurnitureStroke) furnitureMask[y * sampleWidth + x] = 1;
    }
  }

  const components = findTableLikeComponents(furnitureMask, sampleWidth, sampleHeight);
  const clusteredComponents = clusterTableComponents(components, sampleWidth, sampleHeight);
  const tableCandidates = clusteredComponents
    .map((component) => tableCandidateFromComponent(component, sampleWidth, sampleHeight))
    .filter((table): table is DetectedPlanTable => Boolean(table));

  return mergeDetectedTables(tableCandidates)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 28)
    .sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x));
}

function findTableLikeComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(width * height);
  const components: TableComponent[] = [];
  const minWidth = Math.max(5, width * 0.009);
  const minHeight = Math.max(5, height * 0.009);
  const maxWidth = width * 0.14;
  const maxHeight = height * 0.14;

  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX;
      if (visited[startIndex] || !mask[startIndex]) continue;

      const queue = [startIndex];
      visited[startIndex] = 1;
      let cursor = 0;
      let area = 0;
      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;

      while (cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        const x = index % width;
        const y = Math.floor(index / width);
        area += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const neighborX = x + dx;
            const neighborY = y + dy;
            if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) continue;
            const neighbor = neighborY * width + neighborX;
            if (visited[neighbor] || !mask[neighbor]) continue;
            visited[neighbor] = 1;
            queue.push(neighbor);
          }
        }
      }

      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
      const density = area / Math.max(componentWidth * componentHeight, 1);
      const aspectRatio = componentWidth / Math.max(componentHeight, 1);
      const isLikelyFurniturePart =
        componentWidth >= minWidth &&
        componentHeight >= minHeight &&
        componentWidth <= maxWidth &&
        componentHeight <= maxHeight &&
        density >= 0.05 &&
        density <= 0.85 &&
        aspectRatio >= 0.22 &&
        aspectRatio <= 4.5;

      if (!isLikelyFurniturePart) continue;

      components.push({ minX, minY, maxX, maxY, area });
    }
  }

  return components;
}

function clusterTableComponents(components: TableComponent[], width: number, height: number) {
  const clusters: TableComponent[] = [];
  const maxGap = Math.max(10, Math.min(width, height) * 0.035);

  components
    .slice()
    .sort((a, b) => a.minY - b.minY || a.minX - b.minX)
    .forEach((component) => {
      const clusterIndex = clusters.findIndex((cluster) => componentGap(cluster, component) <= maxGap && mergedComponentLooksLikeTable(cluster, component, width, height));
      if (clusterIndex === -1) {
        clusters.push({ ...component });
        return;
      }

      const cluster = clusters[clusterIndex];
      clusters[clusterIndex] = {
        minX: Math.min(cluster.minX, component.minX),
        minY: Math.min(cluster.minY, component.minY),
        maxX: Math.max(cluster.maxX, component.maxX),
        maxY: Math.max(cluster.maxY, component.maxY),
        area: cluster.area + component.area
      };
    });

  return clusters;
}

function mergedComponentLooksLikeTable(first: TableComponent, second: TableComponent, width: number, height: number) {
  const minX = Math.min(first.minX, second.minX);
  const minY = Math.min(first.minY, second.minY);
  const maxX = Math.max(first.maxX, second.maxX);
  const maxY = Math.max(first.maxY, second.maxY);
  const mergedWidth = maxX - minX + 1;
  const mergedHeight = maxY - minY + 1;
  const aspectRatio = mergedWidth / Math.max(mergedHeight, 1);
  const density = (first.area + second.area) / Math.max(mergedWidth * mergedHeight, 1);

  return mergedWidth <= width * 0.16 && mergedHeight <= height * 0.16 && aspectRatio >= 0.28 && aspectRatio <= 4.2 && density >= 0.025;
}

function componentGap(first: TableComponent, second: TableComponent) {
  const horizontalGap = Math.max(0, Math.max(first.minX, second.minX) - Math.min(first.maxX, second.maxX));
  const verticalGap = Math.max(0, Math.max(first.minY, second.minY) - Math.min(first.maxY, second.maxY));
  return Math.hypot(horizontalGap, verticalGap);
}

function tableCandidateFromComponent(component: TableComponent, width: number, height: number) {
  const componentWidth = component.maxX - component.minX + 1;
  const componentHeight = component.maxY - component.minY + 1;
  const density = component.area / Math.max(componentWidth * componentHeight, 1);
  const aspectRatio = componentWidth / Math.max(componentHeight, 1);
  const footprint = (componentWidth * componentHeight) / Math.max(width * height, 1);
  const isTableCandidate =
    componentWidth >= width * 0.018 &&
    componentHeight >= height * 0.018 &&
    componentWidth <= width * 0.18 &&
    componentHeight <= height * 0.18 &&
    density >= 0.025 &&
    density <= 0.65 &&
    aspectRatio >= 0.35 &&
    aspectRatio <= 3.8 &&
    footprint >= 0.00025 &&
    footprint <= 0.025;

  if (!isTableCandidate) return null;

  return {
    x: ((component.minX + componentWidth / 2) / width) * 100,
    y: ((component.minY + componentHeight / 2) / height) * 100,
    width: (componentWidth / width) * 100,
    height: (componentHeight / height) * 100,
    confidence: clampDecimal(0.44 + Math.min(footprint * 22, 0.22) + Math.min(density * 0.24, 0.18), 0.35, 0.88)
  } satisfies DetectedPlanTable;
}

function mergeDetectedTables(tables: DetectedPlanTable[]) {
  const merged: DetectedPlanTable[] = [];

  tables.forEach((table) => {
    const existingIndex = merged.findIndex((current) => detectedTableOverlap(current, table) > 0.58 || distanceBetweenTables(current, table) < 3.5);
    if (existingIndex === -1) {
      merged.push(table);
      return;
    }

    const existing = merged[existingIndex];
    merged[existingIndex] = existing.confidence >= table.confidence ? existing : table;
  });

  return merged;
}

function detectedTableOverlap(first: DetectedPlanTable, second: DetectedPlanTable) {
  const firstLeft = first.x - first.width / 2;
  const firstTop = first.y - first.height / 2;
  const secondLeft = second.x - second.width / 2;
  const secondTop = second.y - second.height / 2;
  const x1 = Math.max(firstLeft, secondLeft);
  const y1 = Math.max(firstTop, secondTop);
  const x2 = Math.min(firstLeft + first.width, secondLeft + second.width);
  const y2 = Math.min(firstTop + first.height, secondTop + second.height);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const smallerArea = Math.min(first.width * first.height, second.width * second.height);
  return smallerArea ? intersection / smallerArea : 0;
}

function distanceBetweenTables(first: DetectedPlanTable, second: DetectedPlanTable) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

type RoomCandidate = {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  touchesEdge: boolean;
  source: "closed-space" | "projection" | "fallback";
};

type PixelBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

async function detectRoomsFromPlan(dataUrl: string, width: number, height: number) {
  const image = await loadImage(dataUrl);
  const sampleScale = Math.min(1, 260 / Math.max(width, height));
  const sampleWidth = Math.max(96, Math.round(width * sampleScale));
  const sampleHeight = Math.max(96, Math.round(height * sampleScale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return fallbackDetectedRooms(width, height);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const obstacleMask = new Uint8Array(sampleWidth * sampleHeight);
  const contentBounds = findPlanContentBounds(imageData, sampleWidth, sampleHeight, obstacleMask);

  if (!contentBounds) return fallbackDetectedRooms(width, height);

  const blockedMask = dilateObstacleMask(obstacleMask, sampleWidth, sampleHeight, contentBounds);
  const connectedRooms = findOpenRoomCandidates(blockedMask, sampleWidth, sampleHeight, contentBounds);
  const projectedRooms = connectedRooms.length >= 2 ? [] : projectRoomsFromWallLines(obstacleMask, sampleWidth, sampleHeight, contentBounds);
  const candidates = connectedRooms.length >= 2 ? connectedRooms : projectedRooms;
  const normalizedCandidates = candidates.length ? candidates : fallbackRoomCandidates(contentBounds, sampleWidth, sampleHeight);

  return classifyRoomCandidates(normalizedCandidates, width, height);
}

function findPlanContentBounds(imageData: Uint8ClampedArray, width: number, height: number, obstacleMask: Uint8Array) {
  const bounds: PixelBounds = { minX: width, minY: height, maxX: 0, maxY: 0 };
  let inkPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      const alpha = imageData[pixelIndex + 3];
      const red = imageData[pixelIndex];
      const green = imageData[pixelIndex + 1];
      const blue = imageData[pixelIndex + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const saturation = colorSaturation(red, green, blue);
      const isPlanStroke = alpha > 32 && (luminance < 205 || (saturation > 0.32 && luminance < 232));

      if (!isPlanStroke) continue;

      obstacleMask[y * width + x] = 1;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
      inkPixels += 1;
    }
  }

  if (!inkPixels) return null;

  const margin = Math.max(3, Math.round(Math.min(width, height) * 0.025));
  return {
    minX: Math.max(0, bounds.minX - margin),
    minY: Math.max(0, bounds.minY - margin),
    maxX: Math.min(width - 1, bounds.maxX + margin),
    maxY: Math.min(height - 1, bounds.maxY + margin)
  } satisfies PixelBounds;
}

function dilateObstacleMask(obstacleMask: Uint8Array, width: number, height: number, bounds: PixelBounds) {
  const blockedMask = new Uint8Array(width * height);
  const radius = Math.max(1, Math.round(Math.min(width, height) / 150));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const outsidePlan = x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY;

      if (outsidePlan) {
        blockedMask[index] = 1;
        continue;
      }

      if (!obstacleMask[index]) continue;

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          blockedMask[nextY * width + nextX] = 1;
        }
      }
    }
  }

  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    blockedMask[bounds.minY * width + x] = 1;
    blockedMask[bounds.maxY * width + x] = 1;
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    blockedMask[y * width + bounds.minX] = 1;
    blockedMask[y * width + bounds.maxX] = 1;
  }

  return blockedMask;
}

function findOpenRoomCandidates(blockedMask: Uint8Array, width: number, height: number, bounds: PixelBounds) {
  const visited = new Uint8Array(width * height);
  const candidates: RoomCandidate[] = [];
  const minArea = Math.max(24, Math.round(width * height * 0.004));
  const maxArea = Math.round(width * height * 0.55);

  for (let startY = bounds.minY + 1; startY < bounds.maxY; startY += 1) {
    for (let startX = bounds.minX + 1; startX < bounds.maxX; startX += 1) {
      const startIndex = startY * width + startX;
      if (visited[startIndex] || blockedMask[startIndex]) continue;

      const queue = [startIndex];
      visited[startIndex] = 1;
      let cursor = 0;
      let area = 0;
      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;
      let touchesEdge = false;

      while (cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        const x = index % width;
        const y = Math.floor(index / width);
        area += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        touchesEdge = touchesEdge || x <= bounds.minX + 1 || x >= bounds.maxX - 1 || y <= bounds.minY + 1 || y >= bounds.maxY - 1;

        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1]
        ];
        for (const [neighborX, neighborY] of neighbors) {
          if (neighborX < bounds.minX || neighborX > bounds.maxX || neighborY < bounds.minY || neighborY > bounds.maxY) continue;
          const neighbor = neighborY * width + neighborX;
          if (visited[neighbor] || blockedMask[neighbor]) continue;
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }

      const roomWidth = maxX - minX + 1;
      const roomHeight = maxY - minY + 1;
      const bboxAreaRatio = (roomWidth * roomHeight) / Math.max(width * height, 1);
      const isUsefulCandidate =
        area >= minArea &&
        area <= maxArea &&
        roomWidth >= width * 0.08 &&
        roomHeight >= height * 0.08 &&
        (!touchesEdge || bboxAreaRatio < 0.4);

      if (!isUsefulCandidate) continue;

      candidates.push({
        x: (minX / width) * 100,
        y: (minY / height) * 100,
        width: (roomWidth / width) * 100,
        height: (roomHeight / height) * 100,
        area,
        touchesEdge,
        source: "closed-space"
      });
    }
  }

  return candidates.sort((a, b) => b.area - a.area).slice(0, 10);
}

function projectRoomsFromWallLines(obstacleMask: Uint8Array, width: number, height: number, bounds: PixelBounds) {
  const contentWidth = Math.max(bounds.maxX - bounds.minX + 1, 1);
  const contentHeight = Math.max(bounds.maxY - bounds.minY + 1, 1);
  const verticalCuts = findProjectionCuts(obstacleMask, width, bounds, "vertical");
  const horizontalCuts = findProjectionCuts(obstacleMask, width, bounds, "horizontal");

  if (!verticalCuts.length && !horizontalCuts.length) return [];

  const xSegments = buildSegments(bounds.minX, bounds.maxX, verticalCuts, contentWidth * 0.16);
  const ySegments = buildSegments(bounds.minY, bounds.maxY, horizontalCuts, contentHeight * 0.16);
  const candidates: RoomCandidate[] = [];

  for (let yIndex = 0; yIndex < ySegments.length; yIndex += 1) {
    for (let xIndex = 0; xIndex < xSegments.length; xIndex += 1) {
      const [minX, maxX] = xSegments[xIndex];
      const [minY, maxY] = ySegments[yIndex];
      const roomWidth = maxX - minX;
      const roomHeight = maxY - minY;
      const area = roomWidth * roomHeight;

      if (roomWidth < contentWidth * 0.16 || roomHeight < contentHeight * 0.16 || area < contentWidth * contentHeight * 0.04) continue;

      candidates.push({
        x: (minX / width) * 100,
        y: (minY / height) * 100,
        width: (roomWidth / width) * 100,
        height: (roomHeight / height) * 100,
        area,
        touchesEdge: false,
        source: "projection"
      });
    }
  }

  return candidates.sort((a, b) => b.area - a.area).slice(0, 8);
}

function findProjectionCuts(obstacleMask: Uint8Array, width: number, bounds: PixelBounds, axis: "vertical" | "horizontal") {
  const cuts: number[] = [];
  const isVertical = axis === "vertical";
  const start = isVertical ? bounds.minX : bounds.minY;
  const end = isVertical ? bounds.maxX : bounds.maxY;
  const crossStart = isVertical ? bounds.minY : bounds.minX;
  const crossEnd = isVertical ? bounds.maxY : bounds.maxX;
  const crossLength = Math.max(crossEnd - crossStart + 1, 1);
  const threshold = crossLength * 0.22;
  let clusterStart: number | null = null;

  for (let primary = start; primary <= end; primary += 1) {
    let count = 0;
    for (let cross = crossStart; cross <= crossEnd; cross += 1) {
      const x = isVertical ? primary : cross;
      const y = isVertical ? cross : primary;
      count += obstacleMask[y * width + x];
    }

    if (count >= threshold && clusterStart === null) {
      clusterStart = primary;
    } else if (count < threshold && clusterStart !== null) {
      cuts.push(Math.round((clusterStart + primary - 1) / 2));
      clusterStart = null;
    }
  }

  if (clusterStart !== null) cuts.push(Math.round((clusterStart + end) / 2));

  const guard = (end - start) * 0.12;
  return cuts.filter((cut) => cut > start + guard && cut < end - guard);
}

function buildSegments(start: number, end: number, cuts: number[], minSize: number) {
  const points = [start, ...cuts.sort((a, b) => a - b), end];
  const segments: Array<[number, number]> = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const min = points[index];
    const max = points[index + 1];
    if (max - min < minSize) continue;
    segments.push([min, max]);
  }

  return segments.length ? segments : [[start, end] as [number, number]];
}

function fallbackRoomCandidates(bounds: PixelBounds, width: number, height: number) {
  const contentWidth = bounds.maxX - bounds.minX + 1;
  const contentHeight = bounds.maxY - bounds.minY + 1;
  const isWide = contentWidth >= contentHeight;

  if (isWide) {
    return [
      roomCandidateFromPixels(bounds.minX, bounds.minY, bounds.minX + contentWidth * 0.48, bounds.maxY, width, height, "fallback"),
      roomCandidateFromPixels(bounds.minX + contentWidth * 0.52, bounds.minY, bounds.maxX, bounds.maxY, width, height, "fallback")
    ];
  }

  return [
    roomCandidateFromPixels(bounds.minX, bounds.minY, bounds.maxX, bounds.minY + contentHeight * 0.48, width, height, "fallback"),
    roomCandidateFromPixels(bounds.minX, bounds.minY + contentHeight * 0.52, bounds.maxX, bounds.maxY, width, height, "fallback")
  ];
}

function roomCandidateFromPixels(minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, source: RoomCandidate["source"]) {
  return {
    x: (minX / width) * 100,
    y: (minY / height) * 100,
    width: ((maxX - minX) / width) * 100,
    height: ((maxY - minY) / height) * 100,
    area: (maxX - minX) * (maxY - minY),
    touchesEdge: false,
    source
  } satisfies RoomCandidate;
}

function fallbackDetectedRooms(width: number, height: number) {
  const bounds = { minX: width * 0.08, minY: height * 0.08, maxX: width * 0.92, maxY: height * 0.92 };
  return classifyRoomCandidates(fallbackRoomCandidates(bounds, width, height), width, height);
}

function classifyRoomCandidates(candidates: RoomCandidate[], width: number, height: number) {
  const sortedCandidates = mergeSimilarCandidates(candidates)
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, 8);
  let diningIndex = 0;
  let kitchenAssigned = false;

  return sortedCandidates.map((candidate, index) => {
    const areaPercent = candidate.width * candidate.height;
    const compactness = Math.min(candidate.width, candidate.height) / Math.max(candidate.width, candidate.height, 1);
    let kind: DetectedRoomKind = "other";

    if (areaPercent >= 4.5 && compactness >= 0.22 && diningIndex < 4) {
      kind = "dining";
      diningIndex += 1;
    } else if (areaPercent >= 3.2 && !kitchenAssigned) {
      kind = "kitchen";
      kitchenAssigned = true;
    } else if (areaPercent < 3.2 || compactness < 0.2) {
      kind = "service";
    }

    const confidenceBase = candidate.source === "closed-space" ? 0.62 : candidate.source === "projection" ? 0.52 : 0.42;
    const confidence = clampDecimal(confidenceBase + Math.min(areaPercent / 100, 0.18) + (compactness > 0.32 ? 0.12 : 0), 0.38, 0.94);
    const name = kind === "dining" ? `Sala ${diningIndex}` : kind === "kitchen" ? "Cucina" : `Ambiente ${index + 1}`;

    return {
      id: crypto.randomUUID(),
      name,
      kind,
      x: clampDecimal(candidate.x, 0, 98),
      y: clampDecimal(candidate.y, 0, 98),
      width: clampDecimal(Math.min(candidate.width, 100 - candidate.x), 2, 100),
      height: clampDecimal(Math.min(candidate.height, 100 - candidate.y), 2, 100),
      confidence,
      enabled: kind === "dining"
    } satisfies DetectedFloorRoom;
  });
}

function mergeSimilarCandidates(candidates: RoomCandidate[]) {
  const merged: RoomCandidate[] = [];

  candidates.forEach((candidate) => {
    const duplicate = merged.some((current) => rectangleOverlap(current, candidate) > 0.72);
    if (!duplicate) merged.push(candidate);
  });

  return merged;
}

function rectangleOverlap(first: RoomCandidate, second: RoomCandidate) {
  const x1 = Math.max(first.x, second.x);
  const y1 = Math.max(first.y, second.y);
  const x2 = Math.min(first.x + first.width, second.x + second.width);
  const y2 = Math.min(first.y + first.height, second.y + second.height);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const smallerArea = Math.min(first.width * first.height, second.width * second.height);
  return smallerArea ? intersection / smallerArea : 0;
}

function colorSaturation(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max === 0 ? 0 : (max - min) / max;
}

function clampDecimal(value: number, min: number, max: number) {
  return Math.min(Math.max(Number(value.toFixed(2)), min), max);
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
