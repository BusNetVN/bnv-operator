import type { Company } from "@/types/companies";

export type SeatMapCellType = "seat" | "empty";

export type SeatMapCell = {
  floor: number;
  row: number;
  col: number;
  code: string;
  type: SeatMapCellType;
};

export type SeatMapType =
  | "seat"
  | "seat_limousine"
  | "sleeper"
  | "sleeper_limousine"
  | "vip_cabin";

export type SeatMap = {
  id: string;
  company_uuid: string;
  company: Company;
  seat_map_code: string;
  name: string;
  layout_type: SeatMapType;
  floors: number;
  rows: number;
  columns: number;
  seats: SeatMapCell[];
  seat_count: number;
  note: string;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type SeatMapInput = {
  seat_map_code: string;
  name: string;
  layout_type: SeatMapType;
  floors: string;
  rows: string;
  columns: string;
  seats: SeatMapCell[];
  note: string;
  status: boolean;
};

export type SeatMapPayload = {
  seat_map_code: string;
  name: string;
  layout_type: SeatMapType;
  floors: number;
  rows: number;
  columns: number;
  seats: SeatMapCell[];
  note: string;
  status: boolean;
};
