import type { SeatMap, SeatMapPayload } from "@/types/seat-maps";
import { coreRequest } from "@/service/core-api";

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
