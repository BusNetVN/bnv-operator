import type { Company } from "@/lib/companies";
import { coreRequest } from "@/lib/core";

export type SeatMapCellType = "seat" | "empty";

export type SeatMapCell = {
  floor: number;
  row: number;
  col: number;
  code: string;
  type: SeatMapCellType;
};

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

export type SeatMapType =
  | "seat"
  | "seat_limousine"
  | "sleeper"
  | "sleeper_limousine"
  | "vip_cabin";

export const SEAT_MAP_TYPES: { value: SeatMapType; label: string }[] = [
  { value: "seat", label: "Ghế ngồi" },
  { value: "seat_limousine", label: "Ghế ngồi limousine" },
  { value: "sleeper", label: "Giường nằm" },
  { value: "sleeper_limousine", label: "Giường nằm limousine" },
  { value: "vip_cabin", label: "Phòng VIP (Cabin)" },
];

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

export function layoutTypeLabel(value: string) {
  return SEAT_MAP_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function columnLetter(col: number) {
  return String.fromCharCode(64 + col);
}

export function defaultSeatCode(row: number, col: number) {
  return `${columnLetter(col)}${row}`;
}

export function countSeats(seats: SeatMapCell[]) {
  return seats.filter((cell) => cell.type === "seat").length;
}

export function generateSeats(
  floors: number,
  rows: number,
  columns: number,
  previous: SeatMapCell[] = [],
): SeatMapCell[] {
  const prev = new Map(
    previous.map((cell) => [`${cell.floor}-${cell.row}-${cell.col}`, cell]),
  );
  const seats: SeatMapCell[] = [];

  for (let floor = 1; floor <= floors; floor += 1) {
    for (let row = 1; row <= rows; row += 1) {
      for (let col = 1; col <= columns; col += 1) {
        seats.push(
          prev.get(`${floor}-${row}-${col}`) ?? {
            floor,
            row,
            col,
            code: defaultSeatCode(row, col),
            type: "seat",
          },
        );
      }
    }
  }

  return seats;
}

function toPositiveInt(value: string, fallback: number) {
  const next = Number(value.trim());
  if (!Number.isInteger(next) || next < 1) {
    return fallback;
  }
  return next;
}

export function emptySeatMapInput(): SeatMapInput {
  const floors = 1;
  const rows = 10;
  const columns = 4;
  return {
    seat_map_code: "",
    name: "",
    layout_type: "seat",
    floors: String(floors),
    rows: String(rows),
    columns: String(columns),
    seats: generateSeats(floors, rows, columns),
    note: "",
    status: true,
  };
}

export function toSeatMapInput(seatMap: SeatMap): SeatMapInput {
  const floors = seatMap.floors || 1;
  const rows = seatMap.rows || 1;
  const columns = seatMap.columns || 1;
  return {
    seat_map_code: seatMap.seat_map_code.toUpperCase(),
    name: seatMap.name,
    layout_type: seatMap.layout_type || "seat",
    floors: String(floors),
    rows: String(rows),
    columns: String(columns),
    seats: generateSeats(floors, rows, columns, seatMap.seats),
    note: seatMap.note,
    status: seatMap.status,
  };
}

export function toSeatMapPayload(values: SeatMapInput): SeatMapPayload {
  const floors = toPositiveInt(values.floors, 1);
  const rows = toPositiveInt(values.rows, 10);
  const columns = toPositiveInt(values.columns, 4);
  const code = values.seat_map_code.trim().toUpperCase();
  return {
    seat_map_code: code,
    name: values.name.trim() || code,
    layout_type: values.layout_type || "seat",
    floors,
    rows,
    columns,
    seats: generateSeats(floors, rows, columns, values.seats),
    note: values.note.trim(),
    status: values.status,
  };
}

export function listSeatMaps(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return coreRequest<SeatMap[]>(`/seat-maps?${params.toString()}`);
}

export function createSeatMap(companyUuid: string, input: SeatMapPayload) {
  return coreRequest<SeatMap>("/seat-maps", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      company_uuid: companyUuid,
    }),
  });
}

export function updateSeatMap(id: string, input: SeatMapPayload) {
  return coreRequest<SeatMap>(`/seat-maps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSeatMap(id: string) {
  return coreRequest<{ id: string; seat_map_code: string }>(
    `/seat-maps/${id}`,
    {
      method: "DELETE",
    },
  );
}
