export type StoredDiningArea = {
  id: string;
  name: string;
};

export type StoredRoomTable = {
  id: string;
  areaId: string;
  name: string;
  seatsMin: number;
  seatsMax: number;
  positionX: number;
  positionY: number;
};

export type StoredFloorPlan = {
  id: string;
  areaId: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  analyzedAt: string;
  sourceType?: "single-room" | "complete-plan";
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
};

export type StoredRoomLayout = {
  areas: StoredDiningArea[];
  tables: StoredRoomTable[];
  floorPlans: StoredFloorPlan[];
};

export const ROOM_LAYOUT_EVENT = "plateform:room-layout-updated";
const ROOM_LAYOUT_STORAGE_KEY = "plateform-room-layout-v1";

export function readStoredRoomLayout() {
  if (typeof window === "undefined") return null;

  try {
    const rawLayout = window.localStorage.getItem(ROOM_LAYOUT_STORAGE_KEY);
    if (!rawLayout) return null;
    const parsed = JSON.parse(rawLayout) as Partial<StoredRoomLayout> & { floorPlan?: unknown };

    if (!Array.isArray(parsed.areas) || !Array.isArray(parsed.tables)) return null;
    const areas = parsed.areas.filter(isStoredDiningArea);
    const tables = parsed.tables.filter(isStoredRoomTable);
    const firstAreaId = areas[0]?.id ?? "area-main";
    const legacyFloorPlan = normalizeFloorPlan(parsed.floorPlan, firstAreaId, 0);

    return {
      areas,
      tables,
      floorPlans: Array.isArray(parsed.floorPlans)
        ? parsed.floorPlans
            .map((floorPlan, index) => normalizeFloorPlan(floorPlan, firstAreaId, index))
            .filter((floorPlan): floorPlan is StoredFloorPlan => Boolean(floorPlan))
        : legacyFloorPlan
          ? [legacyFloorPlan]
          : []
    } satisfies StoredRoomLayout;
  } catch {
    return null;
  }
}

export function writeStoredRoomLayout(layout: StoredRoomLayout) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(ROOM_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    window.dispatchEvent(new CustomEvent(ROOM_LAYOUT_EVENT, { detail: layout }));
    return true;
  } catch {
    return false;
  }
}

function isStoredDiningArea(value: unknown): value is StoredDiningArea {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as StoredDiningArea).id === "string" &&
      typeof (value as StoredDiningArea).name === "string"
  );
}

function isStoredRoomTable(value: unknown): value is StoredRoomTable {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as StoredRoomTable).id === "string" &&
      typeof (value as StoredRoomTable).areaId === "string" &&
      typeof (value as StoredRoomTable).name === "string" &&
      typeof (value as StoredRoomTable).seatsMin === "number" &&
      typeof (value as StoredRoomTable).seatsMax === "number" &&
      typeof (value as StoredRoomTable).positionX === "number" &&
      typeof (value as StoredRoomTable).positionY === "number"
  );
}

function isStoredFloorPlan(value: unknown): value is StoredFloorPlan {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as StoredFloorPlan).name === "string" &&
      typeof (value as StoredFloorPlan).dataUrl === "string" &&
      typeof (value as StoredFloorPlan).width === "number" &&
      typeof (value as StoredFloorPlan).height === "number" &&
      typeof (value as StoredFloorPlan).analyzedAt === "string"
  );
}

function normalizeFloorPlan(value: unknown, fallbackAreaId: string, index: number): StoredFloorPlan | null {
  if (!isStoredFloorPlan(value)) return null;

  const normalized: StoredFloorPlan = {
    id: typeof (value as Partial<StoredFloorPlan>).id === "string" ? (value as StoredFloorPlan).id : `floor-plan-${index + 1}`,
    areaId: typeof (value as Partial<StoredFloorPlan>).areaId === "string" ? (value as StoredFloorPlan).areaId : fallbackAreaId,
    name: value.name,
    dataUrl: value.dataUrl,
    width: value.width,
    height: value.height,
    analyzedAt: value.analyzedAt
  };

  if ((value as Partial<StoredFloorPlan>).sourceType === "complete-plan" || (value as Partial<StoredFloorPlan>).sourceType === "single-room") {
    normalized.sourceType = (value as StoredFloorPlan).sourceType;
  }

  const sourceX = optionalNumber((value as Partial<StoredFloorPlan>).sourceX);
  const sourceY = optionalNumber((value as Partial<StoredFloorPlan>).sourceY);
  const sourceWidth = optionalNumber((value as Partial<StoredFloorPlan>).sourceWidth);
  const sourceHeight = optionalNumber((value as Partial<StoredFloorPlan>).sourceHeight);

  if (sourceX !== undefined) normalized.sourceX = sourceX;
  if (sourceY !== undefined) normalized.sourceY = sourceY;
  if (sourceWidth !== undefined) normalized.sourceWidth = sourceWidth;
  if (sourceHeight !== undefined) normalized.sourceHeight = sourceHeight;

  return normalized;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
