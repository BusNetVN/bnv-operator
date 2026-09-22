import type { Company } from "@/lib/companies";
import { coreRequest } from "@/lib/core";

export type WeekdayMode = "all" | "custom";

export type ScheduleRoute = {
  id: string;
  route_code: string;
  name: string;
  origin: string;
  destination: string;
};

export type ScheduleSeatMap = {
  id: string;
  seat_map_code: string;
  name: string;
  layout_type: string;
};

export type Schedule = {
  id: string;
  company_uuid: string;
  company: Company;
  route_uuid: string;
  route: ScheduleRoute;
  seat_map_uuid: string;
  seat_map: ScheduleSeatMap;
  start_date: string;
  end_date: string;
  weekday_mode: WeekdayMode;
  weekdays: number[];
  note: string;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleInput = {
  route_uuid: string;
  seat_map_uuid: string;
  start_date: string;
  end_date: string;
  weekday_mode: WeekdayMode;
  weekdays: number[];
  note: string;
  status: boolean;
};

export type SchedulePayload = ScheduleInput;

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

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function emptyScheduleInput(): ScheduleInput {
  return {
    route_uuid: "",
    seat_map_uuid: "",
    start_date: "",
    end_date: "",
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

export function listSchedules(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return coreRequest<Schedule[]>(`/schedules?${params.toString()}`);
}

export function createSchedule(companyUuid: string, input: SchedulePayload) {
  return coreRequest<Schedule>("/schedules", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      company_uuid: companyUuid,
    }),
  });
}

export function updateSchedule(id: string, input: SchedulePayload) {
  return coreRequest<Schedule>(`/schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSchedule(id: string) {
  return coreRequest<{ id: string }>(`/schedules/${id}`, {
    method: "DELETE",
  });
}
