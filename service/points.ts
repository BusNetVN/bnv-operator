import type { Point, PointInput } from "@/types/points";
import { coreRequest } from "@/service/core-api";

function pointBody(input: PointInput) {
  const { province_uuid, ward_uuid, ...rest } = input;
  return {
    ...rest,
    ...(province_uuid ? { province_uuid } : {}),
    ...(ward_uuid ? { ward_uuid } : {}),
  };
}

export function listPoints(companyUuid?: string, query?: string) {
  const params = new URLSearchParams();
  if (companyUuid) {
    params.set("company_uuid", companyUuid);
  }
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }
  return coreRequest<Point[]>(`/points?${params.toString()}`);
}

export function listSharedPoints(query?: string) {
  const params = new URLSearchParams({ scope: "shared" });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }
  return coreRequest<Point[]>(`/points?${params.toString()}`);
}

export function createPoint(companyUuid: string | null, input: PointInput) {
  return coreRequest<Point>("/points", {
    method: "POST",
    body: JSON.stringify({
      ...pointBody(input),
      ...(companyUuid ? { company_uuid: companyUuid } : {}),
    }),
  });
}

export function updatePoint(id: string, input: PointInput) {
  return coreRequest<Point>(`/points/${id}`, {
    method: "PATCH",
    body: JSON.stringify(pointBody(input)),
  });
}

export function deletePoint(id: string) {
  return coreRequest<{ id: string; point_code: string }>(`/points/${id}`, {
    method: "DELETE",
  });
}
