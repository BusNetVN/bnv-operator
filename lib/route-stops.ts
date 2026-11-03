import type { Point } from "@/types/points";
import type { RouteStop, RouteStopDraft } from "@/types/route-stops";

export function draftFromStop(stop: RouteStop): RouteStopDraft {
  return {
    point: stop.point,
    duration_minutes: stop.duration_minutes,
  };
}

export function draftFromPoint(
  point: Point,
  durationMinutes: number,
): RouteStopDraft {
  return {
    point: {
      id: point.id,
      point_code: point.point_code,
      name: point.name,
      point_type: point.point_type,
      address: point.address,
      ward_name: point.ward_name,
      province_name: point.province_name,
      shared: point.shared,
      status: point.status,
    },
    duration_minutes: durationMinutes,
  };
}
