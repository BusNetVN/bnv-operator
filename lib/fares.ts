import type {
  Fare,
  FareInput,
  FarePayload,
  FareSegment,
  FareSegmentInput,
} from "@/types/fares";

export const WEEKDAYS = [
  { value: 1, label: "Thứ 2", short: "T2" },
  { value: 2, label: "Thứ 3", short: "T3" },
  { value: 3, label: "Thứ 4", short: "T4" },
  { value: 4, label: "Thứ 5", short: "T5" },
  { value: 5, label: "Thứ 6", short: "T6" },
  { value: 6, label: "Thứ 7", short: "T7" },
  { value: 7, label: "Chủ nhật", short: "CN" },
] as const;

export const ALL_WEEKDAYS = WEEKDAYS.map((day) => day.value);

export function formatWeekdays(days: number[]) {
  const selected = new Set(days);
  if (WEEKDAYS.every((day) => selected.has(day.value))) {
    return "Tất cả các ngày";
  }
  return WEEKDAYS.filter((day) => selected.has(day.value))
    .map((day) => day.short)
    .join(", ");
}

export function emptyFareInput(routeUuid = ""): FareInput {
  return {
    route_uuid: routeUuid,
    schedule_uuid: "",
    seat_map_uuid: "",
    priority: false,
    start_date: "",
    end_date: "",
    weekdays: [...ALL_WEEKDAYS],
    segments: [],
  };
}

export function emptyFareSegment(): FareSegmentInput {
  return {
    row_key: crypto.randomUUID(),
    origins: [],
    destinations: [],
    price: "",
  };
}

function segmentRow(segments: FareSegment[]): FareSegmentInput {
  const origins = new Map<string, string>();
  const destinations = new Map<string, string>();
  for (const segment of segments) {
    origins.set(segment.origin_point_uuid, segment.origin_name);
    destinations.set(segment.destination_point_uuid, segment.destination_name);
  }
  return {
    row_key: crypto.randomUUID(),
    origins: [...origins].map(([id, name]) => ({ id, name })),
    destinations: [...destinations].map(([id, name]) => ({ id, name })),
    price: String(segments[0]?.price ?? ""),
  };
}

function isPriceRectangle(segments: FareSegment[]) {
  const origins = new Set(segments.map((segment) => segment.origin_point_uuid));
  const destinations = new Set(
    segments.map((segment) => segment.destination_point_uuid),
  );
  if (origins.size * destinations.size !== segments.length) {
    return false;
  }
  const keys = new Set(
    segments.map(
      (segment) =>
        `${segment.origin_point_uuid}:${segment.destination_point_uuid}`,
    ),
  );
  for (const origin of origins) {
    for (const destination of destinations) {
      if (!keys.has(`${origin}:${destination}`)) {
        return false;
      }
    }
  }
  return true;
}

function groupFareSegments(segments: FareSegment[]) {
  const byPrice = new Map<number, FareSegment[]>();
  for (const segment of segments) {
    const current = byPrice.get(segment.price) ?? [];
    current.push(segment);
    byPrice.set(segment.price, current);
  }
  const rows: FareSegmentInput[] = [];
  for (const group of byPrice.values()) {
    if (isPriceRectangle(group)) {
      rows.push(segmentRow(group));
    } else {
      rows.push(...group.map((segment) => segmentRow([segment])));
    }
  }
  return rows;
}

export function toFareInput(fare: Fare): FareInput {
  return {
    route_uuid: fare.route_uuid,
    schedule_uuid: fare.schedule_uuid ?? "",
    seat_map_uuid: fare.seat_map_uuid ?? "",
    priority: fare.priority,
    start_date: fare.start_date.slice(0, 10),
    end_date: fare.end_date.slice(0, 10),
    weekdays:
      fare.weekdays?.length > 0 ? [...fare.weekdays].sort((a, b) => a - b) : [...ALL_WEEKDAYS],
    segments: groupFareSegments(fare.segments),
  };
}

/** Expands every row (origins × destinations) into one segment per pair. */
export function toFarePayload(
  companyUuid: string | null,
  input: FareInput,
): FarePayload {
  return {
    ...(companyUuid ? { company_uuid: companyUuid } : {}),
    route_uuid: input.route_uuid,
    ...(input.schedule_uuid ? { schedule_uuid: input.schedule_uuid } : {}),
    ...(input.seat_map_uuid ? { seat_map_uuid: input.seat_map_uuid } : {}),
    priority: input.priority,
    start_date: input.start_date,
    end_date: input.end_date,
    weekdays: [...input.weekdays].sort((left, right) => left - right),
    segments: input.segments.flatMap((segment) =>
      segment.origins.flatMap((origin) =>
        segment.destinations.map((destination) => ({
          origin_point_uuid: origin.id,
          destination_point_uuid: destination.id,
          price: Number(segment.price),
        })),
      ),
    ),
  };
}

export function formatFarePrice(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}
