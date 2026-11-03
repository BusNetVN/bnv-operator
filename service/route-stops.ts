import type { RouteStop, RouteStopDraft } from "@/types/route-stops";
import { coreRequest } from "@/service/core-api";

export function listRouteStops(routeId: string) {
  return coreRequest<RouteStop[]>(`/routes/${routeId}/stops`);
}

export function saveRouteStops(routeId: string, stops: RouteStopDraft[]) {
  return coreRequest<RouteStop[]>(`/routes/${routeId}/stops`, {
    method: "PUT",
    body: JSON.stringify({
      stops: stops.map((stop, index) => ({
        point_uuid: stop.point.id,
        duration_minutes: index === 0 ? 0 : stop.duration_minutes,
      })),
    }),
  });
}
