import type { MetricPoint, ReservationRow, StaffShiftTemplate } from "@/lib/types";

export const appUser = {
  name: "Admin Plateform",
  email: "admin@plateform.it"
};

export const restaurant = {
  id: "demo-restaurant",
  tenantId: "demo-tenant",
  name: "Pizzeria Plateform",
  phone: "+39 02 0000 0000",
  email: "ciao@plateform.it",
  address: "Via Roma 12, Milano",
  capacity: 40,
  timezone: "Europe/Rome"
};

export const reservations: ReservationRow[] = [
  {
    id: "res-1",
    customerName: "Mario Rossi",
    customerPhone: "+39 333 123 4567",
    customerEmail: "mario@example.it",
    partySize: 4,
    date: "2026-05-07",
    startTime: "20:00",
    endTime: "21:45",
    tableNames: ["T4"],
    status: "confirmed",
    source: "website"
  },
  {
    id: "res-2",
    customerName: "Giulia Bianchi",
    customerPhone: "+39 347 111 2222",
    partySize: 2,
    date: "2026-05-07",
    startTime: "21:00",
    endTime: "22:30",
    tableNames: ["T1"],
    status: "confirmed",
    source: "phone"
  },
  {
    id: "res-3",
    customerName: "Walk-in 6 coperti",
    customerPhone: "-",
    partySize: 6,
    date: "2026-05-07",
    startTime: "19:35",
    endTime: "21:35",
    tableNames: ["T7"],
    status: "seated",
    source: "walkin"
  }
];

export const reservationTrend: MetricPoint[] = [
  { label: "09/04", value: 5 },
  { label: "12/04", value: 8 },
  { label: "15/04", value: 7 },
  { label: "18/04", value: 12 },
  { label: "21/04", value: 9 },
  { label: "24/04", value: 14 },
  { label: "27/04", value: 16 },
  { label: "30/04", value: 12 },
  { label: "03/05", value: 18 },
  { label: "07/05", value: 21 }
];

export const coverAverageByDay: MetricPoint[] = [
  { label: "Dom", value: 72 },
  { label: "Lun", value: 26 },
  { label: "Mar", value: 32 },
  { label: "Mer", value: 38 },
  { label: "Gio", value: 44 },
  { label: "Ven", value: 86 },
  { label: "Sab", value: 94 }
];

export const revenueTrend: MetricPoint[] = [
  { label: "09/04", value: 840 },
  { label: "12/04", value: 1260 },
  { label: "15/04", value: 980 },
  { label: "18/04", value: 1510 },
  { label: "21/04", value: 1310 },
  { label: "24/04", value: 1880 },
  { label: "27/04", value: 2010 },
  { label: "30/04", value: 1700 },
  { label: "03/05", value: 2240 },
  { label: "07/05", value: 2480 }
];

export const paymentMix: MetricPoint[] = [
  { label: "Carta", value: 58 },
  { label: "Contanti", value: 27 },
  { label: "Online", value: 15 }
];

export const roomTables = [
  { id: "t1", name: "T1", seats: 2, status: "reserved", x: 12, y: 18 },
  { id: "t2", name: "T2", seats: 2, status: "available", x: 34, y: 18 },
  { id: "t3", name: "T3", seats: 4, status: "available", x: 56, y: 18 },
  { id: "t4", name: "T4", seats: 4, status: "reserved", x: 78, y: 18 },
  { id: "t5", name: "T5", seats: 4, status: "available", x: 18, y: 56 },
  { id: "t6", name: "T6", seats: 6, status: "available", x: 44, y: 56 },
  { id: "t7", name: "T7", seats: 6, status: "occupied", x: 72, y: 56 }
];

export const shiftTemplates: StaffShiftTemplate[] = [
  { label: "Pranzo", time: "12:00-15:00" },
  { label: "Cena", time: "18:00-23:00" },
  { label: "Full", time: "18:00-24:00" },
  { label: "Mattina", time: "08:00-13:00" },
  { label: "Pomeriggio", time: "15:00-19:00" }
];

export const ingredients = [
  { name: "Farina tipo 0", category: "Impasti", stock: 48, min: 20, cost: 1.15, supplier: "Molino Nord" },
  { name: "Pomodoro San Marzano", category: "Linea pizza", stock: 18, min: 24, cost: 2.4, supplier: "Campania Food" },
  { name: "Fior di latte", category: "Latticini", stock: 12, min: 10, cost: 6.2, supplier: "Caseificio Verde" }
];

export const menuItems = [
  { name: "Margherita", category: "Pizze classiche", price: 8.5, status: "Attiva" },
  { name: "Diavola", category: "Pizze classiche", price: 10, status: "Attiva" },
  { name: "Bufalina", category: "Pizze speciali", price: 12.5, status: "Attiva" }
];
