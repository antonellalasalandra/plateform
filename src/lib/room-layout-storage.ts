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
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  analyzedAt: string;
};

export type StoredRoomLayout = {
  areas: StoredDiningArea[];
  tables: StoredRoomTable[];
  floorPlan: StoredFloorPlan | null;
};

export const ROOM_LAYOUT_EVENT = "plateform:room-layout-updated";
const ROOM_LAYOUT_STORAGE_KEY = "plateform-room-layout-v1";

export function readStoredRoomLayout() {
  if (typeof window === "undefined") return null;

  try {
    const rawLayout = window.localStorage.getItem(ROOM_LAYOUT_STORAGE_KEY);
    if (!rawLayout) return null;
    const parsed = JSON.parse(rawLayout) as Partial<StoredRoomLayout>;

    if (!Array.isArray(parsed.areas) || !Array.isArray(parsed.tables)) return null;

    return {
      areas: parsed.areas.filter(isStoredDiningArea),
      tables: parsed.tables.filter(isStoredRoomTable),
      floorPlan: isStoredFloorPlan(parsed.floorPlan) ? parsed.floorPlan : null
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
