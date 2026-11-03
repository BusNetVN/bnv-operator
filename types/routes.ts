import type { Company } from "@/types/companies";

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
