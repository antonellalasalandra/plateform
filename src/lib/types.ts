export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export type ReservationSource = "website" | "phone" | "walkin" | "admin" | "import";

export type ReservationRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: string;
  startTime: string;
  endTime: string;
  tableNames: string[];
  status: ReservationStatus;
  source: ReservationSource;
  notes?: string;
};

export type MetricPoint = {
  label: string;
  value: number;
};

export type StaffShiftTemplate = {
  label: string;
  time: string;
};
