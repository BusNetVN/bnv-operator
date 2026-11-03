export type RouteStopPoint = {
  id: string;
  point_code: string;
  name: string;
  point_type: string;
  address: string;
  ward_name: string | null;
  province_name: string | null;
  shared: boolean;
  status: boolean;
};

export type RouteStop = {
  id: string;
  sort_order: number;
  duration_minutes: number;
  point: RouteStopPoint;
};

export type RouteStopDraft = {
  point: RouteStopPoint;
  duration_minutes: number;
};
