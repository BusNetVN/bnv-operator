import type {
  Schedule,
  ScheduleInput,
  SchedulePayload,
  WeekdayMode,
} from "@/types/schedules";

export const WEEKDAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "Chủ nhật" },
] as const;

const ALL_WEEKDAYS = WEEKDAYS.map((item) => item.value);

export const HOURS_24 = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

export const MINUTES_60 = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0"),
);

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function emptyScheduleInput(): ScheduleInput {
  return {
    route_uuid: "",
    seat_map_uuid: "",
    start_date: "",
    end_date: "",
    departure_time: "",
    weekday_mode: "all",
    weekdays: [...ALL_WEEKDAYS],
    note: "",
    status: true,
  };
}

export function toScheduleInput(schedule: Schedule): ScheduleInput {
  return {
    route_uuid: schedule.route_uuid,
    seat_map_uuid: schedule.seat_map_uuid,
    start_date: schedule.start_date.slice(0, 10),
    end_date: schedule.end_date.slice(0, 10),
    departure_time: formatTimeInput(schedule.departure_time),
    weekday_mode: schedule.weekday_mode === "custom" ? "custom" : "all",
    weekdays:
      schedule.weekday_mode === "custom" && schedule.weekdays.length
        ? schedule.weekdays
        : [...ALL_WEEKDAYS],
    note: schedule.note,
    status: schedule.status,
  };
}

export function toSchedulePayload(values: ScheduleInput): SchedulePayload {
  const weekdayMode = values.weekday_mode === "custom" ? "custom" : "all";
  return {
    route_uuid: values.route_uuid,
    seat_map_uuid: values.seat_map_uuid,
    start_date: values.start_date,
    end_date: values.end_date,
    departure_time: formatTimeInput(values.departure_time),
    weekday_mode: weekdayMode,
    weekdays:
      weekdayMode === "all"
        ? [...ALL_WEEKDAYS]
        : [...new Set(values.weekdays)].sort((left, right) => left - right),
    note: values.note.trim(),
    status: values.status,
  };
}

export function formatDateRange(start: string, end: string) {
  const from = formatDate(start);
  const to = formatDate(end);
  if (from === to) {
    return from;
  }
  return `${from} → ${to}`;
}

export function formatTimeInput(value?: string) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function splitDepartureTime(value?: string) {
  const formatted = formatTimeInput(value);
  return {
    hour: formatted.slice(0, 2),
    minute: formatted.slice(3, 5),
  };
}

export function formatDepartureTime(value: string) {
  return formatTimeInput(value) || "—";
}

export function formatDate(value: string) {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date || "—";
  }
  return `${day}/${month}/${year}`;
}

export function weekdaysLabel(mode: WeekdayMode, days: number[]) {
  if (mode !== "custom" || days.length >= 7) {
    return "Cả tuần";
  }

  const labels = WEEKDAYS.filter((item) => days.includes(item.value)).map(
    (item) => item.label,
  );
  return labels.length ? labels.join(", ") : "Cả tuần";
}
