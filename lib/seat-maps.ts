import type {
  SeatMap,
  SeatMapCell,
  SeatMapInput,
  SeatMapPayload,
  SeatMapType,
} from "@/types/seat-maps";

export const SEAT_MAP_TYPES: { value: SeatMapType; label: string }[] = [
  { value: "seat", label: "Ghế ngồi" },
  { value: "seat_limousine", label: "Ghế ngồi limousine" },
  { value: "sleeper", label: "Giường nằm" },
  { value: "sleeper_limousine", label: "Giường nằm limousine" },
  { value: "vip_cabin", label: "Phòng VIP (Cabin)" },
];

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
