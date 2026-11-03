import type { Route, RoutePayload } from "@/types/routes";
import { coreRequest } from "@/service/core-api";

export function listRoutes(companyUuid: string, query?: string) {
  const params = new URLSearchParams({ company_uuid: companyUuid });
  const keyword = query?.trim();
  if (keyword) {
    params.set("q", keyword);
  }

  return coreRequest<Route[]>(`/routes?${params.toString()}`);
}

export function createRoute(companyUuid: string, input: RoutePayload) {
  return coreRequest<Route>("/routes", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      company_uuid: companyUuid,
    }),
  });
}

export function updateRoute(id: string, input: RoutePayload) {
  return coreRequest<Route>(`/routes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteRoute(id: string) {
  return coreRequest<{ id: string; route_code: string }>(`/routes/${id}`, {
    method: "DELETE",
  });
}

export function reorderRoutes(companyUuid: string, ids: string[]) {
  return coreRequest<Route[]>("/routes/reorder", {
    method: "PATCH",
    body: JSON.stringify({
      company_uuid: companyUuid,
      ids,
    }),
  });
}
