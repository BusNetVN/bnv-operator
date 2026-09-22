import type { Company } from "@/lib/companies";
import { coreRequest } from "@/lib/core";

export type Route = {
  id: string;
  company_uuid: string;
  company: Company;
  route_code: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  duration_minutes: number | null;
  note: string;
  status: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type RouteInput = {
  route_code: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: string;
  duration_minutes: string;
  note: string;
  status: boolean;
};

export type RoutePayload = {
  route_code: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  duration_minutes: number | null;
  note: string;
  status: boolean;
};

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động";
}

export function routeNameFromEndpoints(origin: string, destination: string) {
  const from = origin.trim();
  const to = destination.trim();
  if (!from || !to) {
    return "";
  }
  return `${from} - ${to}`;
}

export function emptyRouteInput(): RouteInput {
  return {
    route_code: "",
    name: "",
    origin: "",
    destination: "",
    distance_km: "",
    duration_minutes: "",
    note: "",
    status: true,
  };
}

export function toRouteInput(route: Route): RouteInput {
  return {
    route_code: route.route_code.toUpperCase(),
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    distance_km: route.distance_km != null ? String(route.distance_km) : "",
    duration_minutes:
      route.duration_minutes != null ? String(route.duration_minutes) : "",
    note: route.note,
    status: route.status,
  };
}

export function toRoutePayload(values: RouteInput): RoutePayload {
  const origin = values.origin.trim();
  const destination = values.destination.trim();
  return {
    route_code: values.route_code.trim().toUpperCase(),
    name: values.name.trim() || routeNameFromEndpoints(origin, destination),
    origin,
    destination,
    distance_km: parseOptionalInt(values.distance_km),
    duration_minutes: parseOptionalInt(values.duration_minutes),
    note: values.note.trim(),
    status: values.status,
  };
}

export function formatDuration(minutes: number | null) {
  if (!minutes) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) {
    return `${rest} phút`;
  }
  if (!rest) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${rest} phút`;
}

export function itineraryLabel(route: Pick<Route, "origin" | "destination">) {
  return [route.origin, route.destination]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" → ");
}

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

function parseOptionalInt(value: string) {
  const next = value.trim();
  if (!next) {
    return null;
  }
  return Number(next);
}
