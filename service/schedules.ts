import type { Schedule, SchedulePayload } from "@/types/schedules";
import { coreRequest } from "@/service/core-api";

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
